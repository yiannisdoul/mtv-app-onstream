# OnStream Backend API Contracts

## Overview
Backend API for OnStream streaming application built with FastAPI, MongoDB, TMDb API for metadata, and Consumet API for streaming sources.

## Technology Stack
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt
- **External APIs**: 
  - TMDb API (metadata)
  - Consumet API (streaming sources)
- **Caching**: In-memory Redis-like caching
- **Security**: Rate limiting, input sanitization

## API Endpoints

### Movies & TV Shows
- `GET /api/movies` - List paginated movies/shows with filters
- `GET /api/movies/{id}` - Get single movie/show metadata
- `GET /api/movies/{id}/stream` - Get available streaming sources
- `GET /api/search` - Search movies/shows by title, genre, etc.
- `GET /api/trending` - Get trending content
- `GET /api/genres` - Get available genres

### User Management
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### User Features (JWT Protected)
- `POST /api/favorites` - Add movie to favorites
- `DELETE /api/favorites/{id}` - Remove from favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/watch-history` - Add to watch history
- `GET /api/watch-history` - Get watch history
- `DELETE /api/watch-history/{id}` - Remove from history

### Admin Features (Admin JWT Protected)
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/cache/clear` - Clear cache

## Data Models

### User Model
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string", 
  "password_hash": "string",
  "is_admin": "boolean",
  "created_at": "datetime",
  "last_login": "datetime",
  "favorites": ["movie_ids"],
  "watch_history": [
    {
      "movie_id": "string",
      "watched_at": "datetime",
      "progress": "number"
    }
  ]
}
```

### Movie Cache Model
```json
{
  "_id": "ObjectId",
  "tmdb_id": "number",
  "title": "string",
  "overview": "string",
  "poster_path": "string",
  "backdrop_path": "string", 
  "release_date": "string",
  "genres": ["strings"],
  "vote_average": "number",
  "runtime": "number",
  "type": "movie|tv",
  "cached_at": "datetime",
  "expires_at": "datetime"
}
```

### Stream Source Model
```json
{
  "_id": "ObjectId", 
  "tmdb_id": "number",
  "sources": [
    {
      "url": "string",
      "quality": "string",
      "server": "string",
      "type": "string"
    }
  ],
  "cached_at": "datetime",
  "expires_at": "datetime"
}
```

## Integration Points

### Frontend to Backend
- Replace mock data in `mockData.js` with actual API calls
- Update all components to use real endpoints
- Add authentication context for JWT handling
- Add loading states and error handling

### External APIs
- **TMDb API**: Movie metadata, search, trending
- **Consumet API**: Stream source resolution
- **Rate Limiting**: 100 requests per minute per IP
- **Caching**: 24 hours for metadata, 1 hour for streams

## Security Measures
- JWT token authentication
- Password hashing with bcrypt
- Input validation with Pydantic
- Rate limiting per endpoint
- CORS configuration
- API key protection
- Request sanitization

## Environment Variables
```
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=onstream

# APIs
TMDB_API_KEY=your_tmdb_key
CONSUMET_API_BASE=https://api.consumet.org

# Auth
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Security
RATE_LIMIT_PER_MINUTE=100
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
```

## Cache Strategy
- **Metadata Cache**: 24 hours TTL
- **Stream Sources**: 1 hour TTL (frequently change)
- **Search Results**: 6 hours TTL
- **User Data**: No cache (real-time)

## Error Handling
- Standardized error responses
- Detailed logging for debugging
- Graceful fallbacks for external API failures
- User-friendly error messages

## Performance Optimizations
- Async database operations
- Connection pooling
- Response compression
- Pagination for large datasets
- Background tasks for cache warming