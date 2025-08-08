from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio

# Import our modules
from models import *
from auth import *
from external_apis import *
from database import db_service

ROOT_DIR = Path(__file__).parent
env_file = ROOT_DIR / '.env'

# Force load environment variables
load_dotenv(env_file, override=True)

# Verify key environment variables are loaded
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
if TMDB_API_KEY:
    logger.info(f"✅ TMDB API Key loaded successfully")
else:
    logger.error(f"❌ TMDB API Key not found in environment")
    
MONGO_URL = os.getenv('MONGO_URL')
if MONGO_URL:
    logger.info(f"✅ MongoDB URL loaded successfully")
else:
    logger.error(f"❌ MongoDB URL not found in environment")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(
    title="OnStream API",
    description="Backend API for OnStream movie streaming application",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Global database client
db_client = None

async def get_db():
    """Dependency to get database client."""
    return db_service.db

async def get_current_user_with_db(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db = Depends(get_db)
) -> User:
    """Get current user with database dependency."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"username": username})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert ObjectId to string
        user_doc["_id"] = str(user_doc["_id"])
        
        # Update last login
        await db.users.update_one(
            {"username": username},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def get_current_admin_user_with_db(current_user: User = Depends(get_current_user_with_db)) -> User:
    """Get current admin user."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

# Helper function to normalize movie data
def normalize_movie_data(movie_data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize movie data from TMDB."""
    # Handle both movie and TV data structures
    title = movie_data.get("title") or movie_data.get("name", "")
    media_type = "tv" if "first_air_date" in movie_data else "movie"
    
    return {
        "id": movie_data.get("id"),
        "tmdb_id": movie_data.get("id"),  # Make sure tmdb_id is set
        "title": title,
        "overview": movie_data.get("overview", ""),
        "poster_path": f"https://image.tmdb.org/t/p/w500{movie_data['poster_path']}" if movie_data.get("poster_path") else None,
        "backdrop_path": f"https://image.tmdb.org/t/p/w1280{movie_data['backdrop_path']}" if movie_data.get("backdrop_path") else None,
        "release_date": movie_data.get("release_date") or movie_data.get("first_air_date"),
        "first_air_date": movie_data.get("first_air_date"),
        "genres": [{"id": g["id"], "name": g["name"]} for g in movie_data.get("genres", [])],
        "vote_average": movie_data.get("vote_average", 0.0),
        "vote_count": movie_data.get("vote_count", 0),
        "runtime": movie_data.get("runtime"),
        "number_of_seasons": movie_data.get("number_of_seasons"),
        "number_of_episodes": movie_data.get("number_of_episodes"),
        "type": media_type,
        "adult": movie_data.get("adult", False),
        "original_language": movie_data.get("original_language", "en"),
        "popularity": movie_data.get("popularity", 0.0),
        "year": (movie_data.get("release_date") or movie_data.get("first_air_date", ""))[:4] if (movie_data.get("release_date") or movie_data.get("first_air_date")) else None
    }

# Authentication Endpoints
@api_router.post("/auth/register", response_model=APIResponse)
@limiter.limit("5/minute")
async def register_user(user_data: UserCreate, request: Request, db = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({
            "$or": [{"username": user_data.username}, {"email": user_data.email}]
        })
        
        if existing_user:
            return APIResponse(
                success=False,
                message="User with this username or email already exists",
                error="USER_EXISTS"
            )
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hashed_password,
            "is_admin": False,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        result = await db.users.insert_one(user_doc)
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": str(result.inserted_id)}
        )
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return APIResponse(
            success=False,
            message="Registration failed",
            error=str(e)
        )

@api_router.post("/auth/login", response_model=APIResponse)
@limiter.limit("10/minute")
async def login_user(login_data: UserLogin, request: Request, db = Depends(get_db)):
    """Login user and return JWT token."""
    try:
        # Authenticate user
        user_doc = await db.users.find_one({"username": login_data.username})
        
        if not user_doc or not verify_password(login_data.password, user_doc["password_hash"]):
            return APIResponse(
                success=False,
                message="Incorrect username or password",
                error="INVALID_CREDENTIALS"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_doc["username"]}, expires_delta=access_token_expires
        )
        
        # Update last login
        await db.users.update_one(
            {"username": login_data.username},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        token_data = Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return APIResponse(
            success=True,
            message="Login successful",
            data=token_data.dict()
        )
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return APIResponse(
            success=False,
            message="Login failed",
            error=str(e)
        )

@api_router.get("/auth/me", response_model=APIResponse)
@limiter.limit("30/minute")
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user_with_db)):
    """Get current user information."""
    return APIResponse(
        success=True,
        message="User info retrieved successfully",
        data=current_user.dict()
    )

# Movie/TV Endpoints
@api_router.get("/movies", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_movies(
    request: Request,
    page: int = Query(1, ge=1),
    type_filter: Optional[str] = Query(None, alias="type"),
    genre: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db = Depends(get_db)
):
    """Get paginated list of movies and TV shows."""
    try:
        # Try to get from cache first
        filters = {}
        if type_filter:
            filters["type"] = type_filter
        if genre:
            filters["genre"] = genre
        if year:
            filters["year"] = year
        
        cached_data = await db_service.get_movies_paginated(page, 20, filters)
        
        # If cache is empty or insufficient, fetch from TMDB
        if not cached_data["results"] or len(cached_data["results"]) < 10:
            # Fetch popular content from TMDB
            if type_filter == "tv":
                tmdb_data = await tmdb_service.get_popular_tv(page)
            else:
                tmdb_data = await tmdb_service.get_popular_movies(page)
            
            # Cache the data
            for movie in tmdb_data.get("results", []):
                normalized_data = normalize_movie_data(movie)
                await db_service.cache_movie(normalized_data)
            
            # Get updated cache
            cached_data = await db_service.get_movies_paginated(page, 20, filters)
        
        return APIResponse(
            success=True,
            message="Movies retrieved successfully",
            data=cached_data
        )
        
    except Exception as e:
        logger.error(f"Get movies error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve movies",
            error=str(e)
        )

@api_router.get("/movies/{movie_id}", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_movie_details(movie_id: int, request: Request, db = Depends(get_db)):
    """Get detailed information about a specific movie/TV show."""
    try:
        # Check cache first
        cached_movie = await db_service.get_cached_movie(movie_id)
        
        if cached_movie:
            return APIResponse(
                success=True,
                message="Movie details retrieved from cache",
                data=cached_movie.dict()
            )
        
        # Fetch from TMDB
        movie_data = await get_movie_metadata(movie_id, "movie")
        
        if not movie_data:
            # Try as TV show
            movie_data = await get_movie_metadata(movie_id, "tv")
        
        if not movie_data:
            return APIResponse(
                success=False,
                message="Movie not found",
                error="MOVIE_NOT_FOUND"
            )
        
        # Normalize and cache
        normalized_data = normalize_movie_data(movie_data)
        cached_movie = await db_service.cache_movie(normalized_data)
        
        return APIResponse(
            success=True,
            message="Movie details retrieved successfully",
            data=cached_movie.dict()
        )
        
    except Exception as e:
        logger.error(f"Get movie details error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve movie details",
            error=str(e)
        )

@api_router.get("/movies/{movie_id}/stream", response_model=APIResponse)
@limiter.limit("30/minute")
async def get_movie_streams(movie_id: int, request: Request, db = Depends(get_db)):
    """Get streaming sources for a movie/TV show."""
    try:
        # Check cache first
        cached_streams = await db_service.get_cached_streams(movie_id)
        
        if cached_streams:
            return APIResponse(
                success=True,
                message="Streaming sources retrieved from cache",
                data=cached_streams.dict()
            )
        
        # Get movie details for title
        movie_data = await get_movie_metadata(movie_id, "movie")
        if not movie_data:
            movie_data = await get_movie_metadata(movie_id, "tv")
        
        if not movie_data:
            return APIResponse(
                success=False,
                message="Movie not found",
                error="MOVIE_NOT_FOUND"
            )
        
        title = movie_data.get("title") or movie_data.get("name", "")
        year = None
        if movie_data.get("release_date"):
            year = movie_data["release_date"][:4]
        elif movie_data.get("first_air_date"):
            year = movie_data["first_air_date"][:4]
        
        # Get streaming sources
        sources = await get_streaming_sources(movie_id, title, year)
        
        # Cache the sources
        cached_streams = await db_service.cache_streams(movie_id, sources, 1)  # 1 hour cache
        
        return APIResponse(
            success=True,
            message="Streaming sources retrieved successfully",
            data=cached_streams.dict()
        )
        
    except Exception as e:
        logger.error(f"Get movie streams error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve streaming sources",
            error=str(e)
        )

@api_router.get("/search", response_model=APIResponse)
@limiter.limit("60/minute")
async def search_content(
    request: Request,
    q: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1),
    db = Depends(get_db)
):
    """Search movies and TV shows."""
    try:
        # Search in cache first
        cache_results = await db_service.search_movies(q, page)
        
        # If cache results are insufficient, search TMDB
        if not cache_results["results"] or len(cache_results["results"]) < 5:
            tmdb_results = await tmdb_service.search_multi(q, page)
            
            # Cache new results
            for movie in tmdb_results.get("results", []):
                if movie.get("media_type") in ["movie", "tv"]:
                    normalized_data = normalize_movie_data(movie)
                    await db_service.cache_movie(normalized_data)
            
            # Get updated cache results
            cache_results = await db_service.search_movies(q, page)
            
            # If still no results, return TMDB results directly
            if not cache_results["results"]:
                normalized_results = []
                for movie in tmdb_results.get("results", []):
                    if movie.get("media_type") in ["movie", "tv"]:
                        normalized_results.append(normalize_movie_data(movie))
                
                cache_results = {
                    "query": q,
                    "page": page,
                    "total_pages": tmdb_results.get("total_pages", 1),
                    "total_results": tmdb_results.get("total_results", 0),
                    "results": normalized_results
                }
        
        # Add query to results
        cache_results["query"] = q
        
        return APIResponse(
            success=True,
            message="Search completed successfully",
            data=cache_results
        )
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return APIResponse(
            success=False,
            message="Search failed",
            error=str(e)
        )

@api_router.get("/trending", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_trending_content(request: Request, db = Depends(get_db)):
    """Get trending movies and TV shows."""
    try:
        # Get trending from TMDB
        trending_data = await tmdb_service.get_trending("all", "week")
        
        results = []
        for movie in trending_data.get("results", []):
            if movie.get("media_type") in ["movie", "tv"]:
                normalized_data = normalize_movie_data(movie)
                # Cache it
                await db_service.cache_movie(normalized_data)
                results.append(normalized_data)
        
        return APIResponse(
            success=True,
            message="Trending content retrieved successfully",
            data={
                "page": 1,
                "total_pages": 1,
                "total_results": len(results),
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Get trending error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve trending content",
            error=str(e)
        )

@api_router.get("/genres", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_genres_list(request: Request):
    """Get list of available genres."""
    try:
        genres = await get_genres_list()
        
        return APIResponse(
            success=True,
            message="Genres retrieved successfully",
            data={"genres": genres}
        )
        
    except Exception as e:
        logger.error(f"Get genres error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve genres",
            error=str(e)
        )

# User Features (Protected)
@api_router.post("/favorites", response_model=APIResponse)
@limiter.limit("30/minute")
async def add_to_favorites(
    request: Request,
    favorite_data: FavoriteRequest,
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Add movie to user's favorites."""
    try:
        success = await db_service.add_to_favorites(
            current_user.username,
            favorite_data.dict()
        )
        
        if success:
            return APIResponse(
                success=True,
                message="Added to favorites successfully"
            )
        else:
            return APIResponse(
                success=False,
                message="Failed to add to favorites",
                error="ADD_FAVORITE_FAILED"
            )
        
    except Exception as e:
        logger.error(f"Add to favorites error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to add to favorites",
            error=str(e)
        )

@api_router.delete("/favorites/{movie_id}", response_model=APIResponse)
@limiter.limit("30/minute")
async def remove_from_favorites(
    movie_id: int,
    request: Request,
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Remove movie from user's favorites."""
    try:
        success = await db_service.remove_from_favorites(current_user.username, movie_id)
        
        if success:
            return APIResponse(
                success=True,
                message="Removed from favorites successfully"
            )
        else:
            return APIResponse(
                success=False,
                message="Movie not found in favorites",
                error="FAVORITE_NOT_FOUND"
            )
        
    except Exception as e:
        logger.error(f"Remove from favorites error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to remove from favorites",
            error=str(e)
        )

@api_router.get("/favorites", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_user_favorites(
    request: Request,
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Get user's favorite movies."""
    try:
        favorites = await db_service.get_user_favorites(current_user.username, page)
        
        return APIResponse(
            success=True,
            message="Favorites retrieved successfully",
            data=favorites
        )
        
    except Exception as e:
        logger.error(f"Get favorites error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve favorites",
            error=str(e)
        )

@api_router.post("/watch-history", response_model=APIResponse)
@limiter.limit("30/minute")
async def add_to_watch_history(
    request: Request,
    watch_data: WatchHistoryRequest,
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Add movie to user's watch history."""
    try:
        success = await db_service.add_to_watch_history(
            current_user.username,
            watch_data.dict()
        )
        
        if success:
            return APIResponse(
                success=True,
                message="Added to watch history successfully"
            )
        else:
            return APIResponse(
                success=False,
                message="Failed to add to watch history",
                error="ADD_HISTORY_FAILED"
            )
        
    except Exception as e:
        logger.error(f"Add to watch history error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to add to watch history",
            error=str(e)
        )

@api_router.get("/watch-history", response_model=APIResponse)
@limiter.limit("60/minute")
async def get_watch_history(
    request: Request,
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Get user's watch history."""
    try:
        history = await db_service.get_watch_history(current_user.username, page)
        
        return APIResponse(
            success=True,
            message="Watch history retrieved successfully",
            data=history
        )
        
    except Exception as e:
        logger.error(f"Get watch history error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve watch history",
            error=str(e)
        )

@api_router.delete("/watch-history/{movie_id}", response_model=APIResponse)
@limiter.limit("30/minute")
async def remove_from_watch_history(
    movie_id: int,
    request: Request,
    current_user: User = Depends(get_current_user_with_db),
    db = Depends(get_db)
):
    """Remove movie from watch history."""
    try:
        success = await db_service.remove_from_watch_history(current_user.username, movie_id)
        
        if success:
            return APIResponse(
                success=True,
                message="Removed from watch history successfully"
            )
        else:
            return APIResponse(
                success=False,
                message="Movie not found in watch history",
                error="HISTORY_NOT_FOUND"
            )
        
    except Exception as e:
        logger.error(f"Remove from watch history error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to remove from watch history",
            error=str(e)
        )

# Admin Endpoints
@api_router.get("/admin/stats", response_model=APIResponse)
@limiter.limit("30/minute")
async def get_system_stats(
    request: Request,
    current_admin: User = Depends(get_current_admin_user_with_db),
    db = Depends(get_db)
):
    """Get system statistics (Admin only)."""
    try:
        stats = await db_service.get_system_stats()
        
        return APIResponse(
            success=True,
            message="System stats retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        logger.error(f"Get system stats error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve system stats",
            error=str(e)
        )

@api_router.post("/admin/cache/clear", response_model=APIResponse)
@limiter.limit("10/minute")
async def clear_cache(
    request: Request,
    current_admin: User = Depends(get_current_admin_user_with_db),
    db = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Clear expired cache entries (Admin only)."""
    try:
        # Run cache clearing in background
        background_tasks.add_task(db_service.clear_expired_cache)
        
        return APIResponse(
            success=True,
            message="Cache clearing initiated successfully"
        )
        
    except Exception as e:
        logger.error(f"Clear cache error: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to clear cache",
            error=str(e)
        )

# Include the API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "OnStream API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and create admin user."""
    logger.info("Starting OnStream API...")
    
    # Connect to database
    await db_service.connect()
    
    # Create admin user if it doesn't exist
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    
    existing_admin = await db_service.db.users.find_one({"username": admin_username})
    if not existing_admin:
        admin_doc = {
            "username": admin_username,
            "email": f"{admin_username}@onstream.com",
            "password_hash": get_password_hash(admin_password),
            "is_admin": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        await db_service.db.users.insert_one(admin_doc)
        logger.info(f"Admin user '{admin_username}' created successfully")
    
    logger.info("OnStream API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources."""
    logger.info("Shutting down OnStream API...")
    await db_service.disconnect()
    logger.info("OnStream API shut down successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )