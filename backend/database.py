from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from typing import List, Optional, Dict, Any
from models import MovieMetadata, StreamResponse, User, WatchHistoryItem, FavoriteItem
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.db_name = os.getenv("DB_NAME", "onstream")
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(self.mongo_url)
            self.db = self.client[self.db_name]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
            
            # Create indexes
            await self.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
    
    async def create_indexes(self):
        """Create database indexes for better performance."""
        try:
            # Users collection indexes
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("email", unique=True)
            
            # Movies collection indexes
            await self.db.movies.create_index("tmdb_id", unique=True)
            await self.db.movies.create_index("type")
            await self.db.movies.create_index("expires_at")
            await self.db.movies.create_index([("title", "text"), ("overview", "text")])
            
            # Streams collection indexes
            await self.db.streams.create_index("tmdb_id")
            await self.db.streams.create_index("expires_at")
            
            # Watch history indexes
            await self.db.watch_history.create_index([("username", 1), ("tmdb_id", 1)])
            await self.db.watch_history.create_index("username")
            
            # Favorites indexes
            await self.db.favorites.create_index([("username", 1), ("tmdb_id", 1)], unique=True)
            await self.db.favorites.create_index("username")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {str(e)}")
    
    # Movie/TV Methods
    async def cache_movie(self, movie_data: Dict[str, Any], cache_hours: int = 24) -> MovieMetadata:
        """Cache movie/TV metadata."""
        expires_at = datetime.utcnow() + timedelta(hours=cache_hours)
        
        movie_doc = {
            "tmdb_id": movie_data["id"],
            "title": movie_data.get("title") or movie_data.get("name", ""),
            "overview": movie_data.get("overview", ""),
            "poster_path": movie_data.get("poster_path"),
            "backdrop_path": movie_data.get("backdrop_path"),
            "release_date": movie_data.get("release_date"),
            "first_air_date": movie_data.get("first_air_date"),
            "genres": movie_data.get("genres", []),
            "vote_average": movie_data.get("vote_average", 0.0),
            "vote_count": movie_data.get("vote_count", 0),
            "runtime": movie_data.get("runtime"),
            "number_of_seasons": movie_data.get("number_of_seasons"),
            "number_of_episodes": movie_data.get("number_of_episodes"),
            "type": "tv" if "first_air_date" in movie_data else "movie",
            "adult": movie_data.get("adult", False),
            "original_language": movie_data.get("original_language", "en"),
            "popularity": movie_data.get("popularity", 0.0),
            "cached_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        # Upsert movie data
        result = await self.db.movies.update_one(
            {"tmdb_id": movie_data["id"]},
            {"$set": movie_doc},
            upsert=True
        )
        
        # Add the database ID for return object
        if result.upserted_id:
            movie_doc["_id"] = str(result.upserted_id)
        else:
            # Get existing doc ID
            existing = await self.db.movies.find_one({"tmdb_id": movie_data["id"]})
            if existing:
                movie_doc["_id"] = str(existing["_id"])
        
        return MovieMetadata(**movie_doc)
    
    async def get_cached_movie(self, tmdb_id: int) -> Optional[MovieMetadata]:
        """Get cached movie/TV metadata."""
        movie_doc = await self.db.movies.find_one({
            "tmdb_id": tmdb_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if movie_doc:
            # Convert ObjectId to string
            movie_doc["_id"] = str(movie_doc["_id"])
            return MovieMetadata(**movie_doc)
        return None
    
    async def cache_streams(self, tmdb_id: int, sources: List[Dict], cache_hours: int = 1) -> StreamResponse:
        """Cache streaming sources."""
        expires_at = datetime.utcnow() + timedelta(hours=cache_hours)
        
        stream_doc = {
            "tmdb_id": tmdb_id,
            "sources": sources,
            "subtitles": [],  # Can be extended later
            "cached_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        result = await self.db.streams.update_one(
            {"tmdb_id": tmdb_id},
            {"$set": stream_doc},
            upsert=True
        )
        
        # Add the database ID for return object
        if result.upserted_id:
            stream_doc["_id"] = str(result.upserted_id)
        else:
            # Get existing doc ID
            existing = await self.db.streams.find_one({"tmdb_id": tmdb_id})
            if existing:
                stream_doc["_id"] = str(existing["_id"])
        
        return StreamResponse(**stream_doc)
    
    async def get_cached_streams(self, tmdb_id: int) -> Optional[StreamResponse]:
        """Get cached streaming sources."""
        stream_doc = await self.db.streams.find_one({
            "tmdb_id": tmdb_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if stream_doc:
            # Convert ObjectId to string
            stream_doc["_id"] = str(stream_doc["_id"])
            return StreamResponse(**stream_doc)
        return None
    
    async def search_movies(self, query: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Search cached movies."""
        skip = (page - 1) * limit
        
        # Text search
        movies_cursor = self.db.movies.find(
            {
                "$text": {"$search": query},
                "expires_at": {"$gt": datetime.utcnow()}
            }
        ).skip(skip).limit(limit)
        
        movies = []
        async for movie_doc in movies_cursor:
            movies.append(MovieMetadata(**movie_doc))
        
        # Get total count
        total_count = await self.db.movies.count_documents({
            "$text": {"$search": query},
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        return {
            "page": page,
            "total_pages": (total_count // limit) + (1 if total_count % limit else 0),
            "total_results": total_count,
            "results": movies
        }
    
    async def get_movies_paginated(self, page: int = 1, limit: int = 20, filters: Dict = None) -> Dict[str, Any]:
        """Get paginated movies with filters."""
        skip = (page - 1) * limit
        query = {"expires_at": {"$gt": datetime.utcnow()}}
        
        if filters:
            if filters.get("type"):
                query["type"] = filters["type"]
            if filters.get("genre"):
                query["genres.name"] = filters["genre"]
            if filters.get("year"):
                if filters["type"] == "tv":
                    query["first_air_date"] = {"$regex": f"^{filters['year']}"}
                else:
                    query["release_date"] = {"$regex": f"^{filters['year']}"}
        
        movies_cursor = self.db.movies.find(query).sort("popularity", -1).skip(skip).limit(limit)
        
        movies = []
        async for movie_doc in movies_cursor:
            movies.append(MovieMetadata(**movie_doc))
        
        total_count = await self.db.movies.count_documents(query)
        
        return {
            "page": page,
            "total_pages": (total_count // limit) + (1 if total_count % limit else 0),
            "total_results": total_count,
            "results": movies
        }
    
    # User Methods
    async def add_to_favorites(self, username: str, favorite_data: Dict) -> bool:
        """Add movie to user's favorites."""
        try:
            favorite_doc = {
                "username": username,
                "movie_id": str(favorite_data["tmdb_id"]),
                "tmdb_id": favorite_data["tmdb_id"],
                "title": favorite_data["title"],
                "poster_path": favorite_data.get("poster_path"),
                "type": favorite_data.get("type", "movie"),
                "added_at": datetime.utcnow()
            }
            
            await self.db.favorites.update_one(
                {"username": username, "tmdb_id": favorite_data["tmdb_id"]},
                {"$set": favorite_doc},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error adding to favorites: {str(e)}")
            return False
    
    async def remove_from_favorites(self, username: str, tmdb_id: int) -> bool:
        """Remove movie from user's favorites."""
        try:
            result = await self.db.favorites.delete_one({
                "username": username,
                "tmdb_id": tmdb_id
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error removing from favorites: {str(e)}")
            return False
    
    async def get_user_favorites(self, username: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get user's favorite movies."""
        skip = (page - 1) * limit
        
        favorites_cursor = self.db.favorites.find(
            {"username": username}
        ).sort("added_at", -1).skip(skip).limit(limit)
        
        favorites = []
        async for fav_doc in favorites_cursor:
            favorites.append(FavoriteItem(**fav_doc))
        
        total_count = await self.db.favorites.count_documents({"username": username})
        
        return {
            "page": page,
            "total_pages": (total_count // limit) + (1 if total_count % limit else 0),
            "total_results": total_count,
            "results": favorites
        }
    
    async def add_to_watch_history(self, username: str, watch_data: Dict) -> bool:
        """Add movie to user's watch history."""
        try:
            watch_doc = {
                "username": username,
                "movie_id": str(watch_data["tmdb_id"]),
                "tmdb_id": watch_data["tmdb_id"],
                "title": watch_data["title"],
                "poster_path": watch_data.get("poster_path"),
                "type": watch_data.get("type", "movie"),
                "progress": watch_data.get("progress", 0.0),
                "watched_at": datetime.utcnow()
            }
            
            await self.db.watch_history.update_one(
                {"username": username, "tmdb_id": watch_data["tmdb_id"]},
                {"$set": watch_doc},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error adding to watch history: {str(e)}")
            return False
    
    async def get_watch_history(self, username: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get user's watch history."""
        skip = (page - 1) * limit
        
        history_cursor = self.db.watch_history.find(
            {"username": username}
        ).sort("watched_at", -1).skip(skip).limit(limit)
        
        history = []
        async for hist_doc in history_cursor:
            history.append(WatchHistoryItem(**hist_doc))
        
        total_count = await self.db.watch_history.count_documents({"username": username})
        
        return {
            "page": page,
            "total_pages": (total_count // limit) + (1 if total_count % limit else 0),
            "total_results": total_count,
            "results": history
        }
    
    async def remove_from_watch_history(self, username: str, tmdb_id: int) -> bool:
        """Remove item from watch history."""
        try:
            result = await self.db.watch_history.delete_one({
                "username": username,
                "tmdb_id": tmdb_id
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error removing from watch history: {str(e)}")
            return False
    
    # Admin Methods
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics."""
        try:
            total_users = await self.db.users.count_documents({})
            total_movies = await self.db.movies.count_documents({})
            total_streams = await self.db.streams.count_documents({})
            
            # Active users today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            active_users = await self.db.users.count_documents({
                "last_login": {"$gte": today}
            })
            
            return {
                "total_users": total_users,
                "total_movies_cached": total_movies,
                "total_streams_cached": total_streams,
                "active_users_today": active_users,
                "cache_hit_rate": 0.85  # Mock value - can be calculated from actual metrics
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {str(e)}")
            return {}
    
    async def clear_expired_cache(self):
        """Clear expired cache entries."""
        try:
            now = datetime.utcnow()
            
            # Clear expired movies
            movie_result = await self.db.movies.delete_many({"expires_at": {"$lt": now}})
            
            # Clear expired streams
            stream_result = await self.db.streams.delete_many({"expires_at": {"$lt": now}})
            
            logger.info(f"Cleared {movie_result.deleted_count} expired movies and {stream_result.deleted_count} expired streams")
            
        except Exception as e:
            logger.error(f"Error clearing expired cache: {str(e)}")

# Global database instance
db_service = DatabaseService()