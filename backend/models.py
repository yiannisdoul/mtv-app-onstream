from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

# User Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserInDB(User):
    password_hash: str

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    username: Optional[str] = None

# Movie/TV Models
class WatchHistoryItem(BaseModel):
    movie_id: str
    tmdb_id: int
    title: str
    poster_path: Optional[str]
    watched_at: datetime = Field(default_factory=datetime.utcnow)
    progress: Optional[float] = 0.0  # 0.0 to 1.0
    type: str = "movie"  # movie or tv

class FavoriteItem(BaseModel):
    movie_id: str
    tmdb_id: int
    title: str
    poster_path: Optional[str]
    added_at: datetime = Field(default_factory=datetime.utcnow)
    type: str = "movie"

class Genre(BaseModel):
    id: int
    name: str

class MovieMetadata(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    tmdb_id: int
    title: str
    overview: str
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    release_date: Optional[str]
    first_air_date: Optional[str]  # For TV shows
    genres: List[Genre] = []
    vote_average: float = 0.0
    vote_count: int = 0
    runtime: Optional[int] = None
    number_of_seasons: Optional[int] = None  # For TV shows
    number_of_episodes: Optional[int] = None  # For TV shows
    type: str = "movie"  # movie or tv
    adult: bool = False
    original_language: str = "en"
    popularity: float = 0.0
    cached_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class StreamSource(BaseModel):
    url: str
    quality: str = "auto"
    server: str = "default"
    type: str = "mp4"
    headers: Optional[Dict[str, str]] = None

class StreamResponse(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    tmdb_id: int
    sources: List[StreamSource] = []
    subtitles: List[Dict[str, Any]] = []
    cached_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# API Response Models
class PaginatedResponse(BaseModel):
    page: int = 1
    total_pages: int = 1
    total_results: int = 0
    results: List[Any] = []

class MovieListResponse(BaseModel):
    page: int = 1
    total_pages: int = 1
    total_results: int = 0
    results: List[MovieMetadata] = []

class SearchResponse(BaseModel):
    query: str
    page: int = 1
    total_pages: int = 1
    total_results: int = 0
    results: List[MovieMetadata] = []

# Request Models
class FavoriteRequest(BaseModel):
    tmdb_id: int
    title: str
    poster_path: Optional[str] = None
    type: str = "movie"

class WatchHistoryRequest(BaseModel):
    tmdb_id: int
    title: str
    poster_path: Optional[str] = None
    progress: Optional[float] = 0.0
    type: str = "movie"

# Admin Models
class SystemStats(BaseModel):
    total_users: int
    total_movies_cached: int
    total_streams_cached: int
    cache_hit_rate: float
    active_users_today: int

class APIResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None
    error: Optional[str] = None