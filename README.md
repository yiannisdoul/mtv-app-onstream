# OnStream - Movie & TV Streaming Platform

A full-stack streaming application built with React frontend and FastAPI backend, featuring movie/TV metadata from TMDB and streaming sources integration.

## 🎬 Features

### Frontend Features
- **Modern React UI** - Mobile-first responsive design
- **Movie & TV Browse** - Grid and list views with filtering
- **Advanced Search** - Search by title, genre, year
- **Movie Details** - Comprehensive movie/show information
- **User Authentication** - Secure JWT-based auth
- **Personal Lists** - Favorites and watch history
- **Streaming Interface** - Multiple server sources
- **Download Management** - Mock download functionality
- **Mobile Navigation** - Bottom navigation for mobile

### Backend Features
- **RESTful API** - FastAPI with automatic documentation
- **External APIs** - TMDB integration for metadata
- **Streaming Sources** - Consumet API integration
- **User Management** - Registration, login, profiles
- **Caching System** - MongoDB-based caching with TTL
- **Rate Limiting** - Protection against API abuse
- **Admin Dashboard** - System statistics and management
- **JWT Authentication** - Secure token-based auth
- **Database Optimization** - Indexed collections with validation

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (or use Docker)
- TMDB API Key

### Local Development Setup

1. **Clone and Setup**
```bash
git clone <your-repo>
cd onstream
```

2. **Backend Setup**
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your TMDB API key

# Run backend
python server.py
```

3. **Frontend Setup**
```bash
cd frontend

# Install dependencies
yarn install

# Run frontend
yarn start
```

4. **Database Setup**
- MongoDB will auto-create collections and indexes
- Admin user created automatically (username: admin, password: admin123)

### Docker Setup (Recommended)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📡 API Documentation

### Base URL
- Development: `http://localhost:8001/api`
- Documentation: `http://localhost:8001/api/docs`

### Authentication Endpoints
```http
POST /api/auth/register - Register new user
POST /api/auth/login    - User login
GET  /api/auth/me       - Get current user
```

### Movie/TV Endpoints
```http
GET  /api/movies           - List movies/TV shows
GET  /api/movies/{id}      - Get movie details
GET  /api/movies/{id}/stream - Get streaming sources
GET  /api/search?q=query   - Search content
GET  /api/trending         - Get trending content
GET  /api/genres           - Get genre list
```

### User Features (JWT Required)
```http
POST   /api/favorites        - Add to favorites
DELETE /api/favorites/{id}   - Remove from favorites
GET    /api/favorites        - Get user favorites
POST   /api/watch-history    - Add to watch history
GET    /api/watch-history    - Get watch history
DELETE /api/watch-history/{id} - Remove from history
```

### Admin Endpoints (Admin JWT Required)
```http
GET  /api/admin/stats       - System statistics
POST /api/admin/cache/clear - Clear expired cache
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=onstream

# External APIs
TMDB_API_KEY=your_tmdb_api_key
CONSUMET_API_BASE=https://api.consumet.org

# JWT Authentication
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Security
RATE_LIMIT_PER_MINUTE=100
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# CORS
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Getting TMDB API Key
1. Create account at [TMDB](https://www.themoviedb.org/)
2. Go to Settings > API
3. Request API key (free)
4. Add to backend .env file

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt
- **External APIs**: TMDB (metadata), Consumet (streams)
- **Deployment**: Docker, Docker Compose

### Project Structure
```
onstream/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── mockData.js    # Mock data (replaced by API)
│   └── package.json
├── backend/               # FastAPI application
│   ├── models.py         # Pydantic models
│   ├── auth.py           # Authentication logic
│   ├── database.py       # Database operations
│   ├── external_apis.py  # External API integrations
│   ├── server.py         # Main FastAPI app
│   └── requirements.txt
├── docker-compose.yml    # Docker orchestration
├── contracts.md          # API documentation
└── README.md
```

### Database Schema
- **users** - User accounts and profiles
- **movies** - Cached movie/TV metadata
- **streams** - Cached streaming sources
- **favorites** - User favorite movies
- **watch_history** - User viewing history

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Admin role separation
- Token expiration handling

### API Security
- Rate limiting (100 req/min per IP)
- Input validation with Pydantic
- CORS configuration
- Request sanitization

### Data Protection
- Password hashing
- Environment variable protection
- Database validation schemas
- Error message sanitization

## 📊 Performance Optimization

### Caching Strategy
- **Metadata**: 24-hour cache for movie/TV data
- **Streams**: 1-hour cache for streaming sources
- **Search**: 6-hour cache for search results
- **Auto-cleanup**: Expired cache removal

### Database Optimization
- Indexed collections for fast queries
- Text search indexes for full-text search
- Composite indexes for user data
- Connection pooling for performance

## 🚀 Deployment

### Production Docker Deploy
```bash
# Update environment
cp .env.example .env
# Configure production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
```bash
# Production environment variables
JWT_SECRET_KEY=strong_production_secret
ADMIN_PASSWORD=secure_admin_password
CORS_ORIGINS=https://yourdomain.com
DEBUG=False
```

## 🧪 Testing

### Manual API Testing
```bash
# Health check
curl http://localhost:8001/health

# Register user
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"testpass"}'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"testpass"}'

# Get movies
curl http://localhost:8001/api/movies
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## ⚖️ Legal Notice

This application is for educational purposes. Ensure compliance with local laws and terms of service for any content sources used. The streaming sources are provided by third-party APIs and are subject to their respective terms and availability.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: `/api/docs` endpoint for interactive API docs
- **Issues**: Create GitHub issues for bugs or feature requests
- **Contact**: [Your contact information]

---

**Built with ❤️ for the streaming community**
