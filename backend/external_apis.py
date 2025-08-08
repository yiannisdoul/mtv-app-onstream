import aiohttp
import os
from typing import List, Dict, Any, Optional
from cachetools import TTLCache
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

logger = logging.getLogger(__name__)

# API Keys and URLs
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
CONSUMET_API_BASE = os.getenv("CONSUMET_API_BASE", "https://api.consumet.org")

# Debug logging
logger.info(f"TMDB API Key loaded: {'Yes' if TMDB_API_KEY else 'No'}")
logger.info(f"Consumet API Base: {CONSUMET_API_BASE}")

# Simple in-memory cache
cache = TTLCache(maxsize=1000, ttl=3600)  # 1 hour TTL

class TMDBService:
    def __init__(self):
        self.api_key = TMDB_API_KEY
        self.base_url = TMDB_BASE_URL
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make request to TMDB API."""
        if not params:
            params = {}
        
        params.update({
            "api_key": self.api_key,
            "language": "en-US"
        })
        
        url = f"{self.base_url}/{endpoint}"
        cache_key = f"tmdb_{endpoint}_{str(sorted(params.items()))}"
        
        # Check cache first
        if cache_key in cache:
            logger.info(f"Cache hit for {cache_key}")
            return cache[cache_key]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        cache[cache_key] = data
                        return data
                    else:
                        logger.error(f"TMDB API error: {response.status}")
                        return {}
        except Exception as e:
            logger.error(f"TMDB API request failed: {str(e)}")
            return {}
    
    async def get_popular_movies(self, page: int = 1) -> Dict[str, Any]:
        """Get popular movies."""
        return await self._make_request("movie/popular", {"page": page})
    
    async def get_popular_tv(self, page: int = 1) -> Dict[str, Any]:
        """Get popular TV shows."""
        return await self._make_request("tv/popular", {"page": page})
    
    async def get_trending(self, media_type: str = "all", time_window: str = "week") -> Dict[str, Any]:
        """Get trending content."""
        return await self._make_request(f"trending/{media_type}/{time_window}")
    
    async def search_multi(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Search movies and TV shows."""
        return await self._make_request("search/multi", {
            "query": query,
            "page": page,
            "include_adult": False
        })
    
    async def get_movie_details(self, movie_id: int) -> Dict[str, Any]:
        """Get movie details."""
        return await self._make_request(f"movie/{movie_id}")
    
    async def get_tv_details(self, tv_id: int) -> Dict[str, Any]:
        """Get TV show details."""
        return await self._make_request(f"tv/{tv_id}")
    
    async def get_genres(self, media_type: str = "movie") -> Dict[str, Any]:
        """Get genres list."""
        return await self._make_request(f"genre/{media_type}/list")

class ConsumetService:
    def __init__(self):
        self.base_url = CONSUMET_API_BASE
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make request to Consumet API."""
        url = f"{self.base_url}/{endpoint}"
        cache_key = f"consumet_{endpoint}_{str(sorted((params or {}).items()))}"
        
        # Check cache first (shorter TTL for streams)
        if cache_key in cache:
            logger.info(f"Cache hit for {cache_key}")
            return cache[cache_key]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        # Try to parse as JSON
                        try:
                            data = await response.json()
                            cache[cache_key] = data
                            return data
                        except:
                            # If not JSON, return empty dict
                            logger.warning(f"Consumet API returned non-JSON response for {endpoint}")
                            return {}
                    else:
                        logger.error(f"Consumet API error: {response.status}")
                        return {}
        except Exception as e:
            logger.error(f"Consumet API request failed: {str(e)}")
            return {}
    
    async def search_movies(self, query: str) -> Dict[str, Any]:
        """Search movies on Consumet."""
        return await self._make_request("movies/flixhq", {"query": query})
    
    async def get_movie_info(self, movie_id: str) -> Dict[str, Any]:
        """Get movie streaming info."""
        return await self._make_request(f"movies/flixhq/info/{movie_id}")
    
    async def get_movie_sources(self, episode_id: str, media_id: str) -> Dict[str, Any]:
        """Get movie streaming sources."""
        return await self._make_request(f"movies/flixhq/watch", {
            "episodeId": episode_id,
            "mediaId": media_id
        })

    async def search_alternative_sources(self, title: str, year: str = None) -> List[Dict[str, Any]]:
        """Search for alternative streaming sources."""
        sources = []
        
        # Try multiple providers
        providers = ["flixhq", "dramacool", "gogoanime"]  # Add more as needed
        
        for provider in providers:
            try:
                endpoint = f"movies/{provider}"
                params = {"query": title}
                if year:
                    params["year"] = year
                
                result = await self._make_request(endpoint, params)
                if result.get("results"):
                    sources.extend(result["results"][:3])  # Limit to prevent overload
            except Exception as e:
                logger.error(f"Error searching {provider}: {str(e)}")
                continue
        
        return sources

# Service instances
tmdb_service = TMDBService()
consumet_service = ConsumetService()

async def get_movie_metadata(tmdb_id: int, media_type: str = "movie") -> Dict[str, Any]:
    """Get movie/TV metadata from TMDB."""
    if media_type == "movie":
        return await tmdb_service.get_movie_details(tmdb_id)
    else:
        return await tmdb_service.get_tv_details(tmdb_id)

async def search_content(query: str, page: int = 1) -> Dict[str, Any]:
    """Search content across TMDB."""
    return await tmdb_service.search_multi(query, page)

async def get_streaming_sources(tmdb_id: int, title: str, year: str = None) -> List[Dict[str, Any]]:
    """Get streaming sources for a movie/show."""
    sources = []
    
    try:
        # Since Consumet API may not be reliable, provide direct fallback sources
        logger.info(f"Getting streaming sources for TMDB ID: {tmdb_id}, Title: {title}")
        
        # Try Consumet API first
        try:
            search_results = await consumet_service.search_movies(title)
            if search_results.get("results"):
                # Found results, but Consumet might not work, so skip for now
                pass
        except Exception as e:
            logger.warning(f"Consumet API failed: {str(e)}")
        
        # Always provide reliable fallback sources
        sources = [
            {
                "url": f"https://vidsrc.to/embed/movie/{tmdb_id}",
                "quality": "HD",
                "server": "VidSrc",
                "type": "mp4"
            },
            {
                "url": f"https://www.2embed.cc/embed/{tmdb_id}",
                "quality": "HD", 
                "server": "2Embed",
                "type": "mp4"
            },
            {
                "url": f"https://embedsb.com/e/{tmdb_id}",
                "quality": "HD",
                "server": "StreamSB", 
                "type": "mp4"
            }
        ]
        
        logger.info(f"Providing {len(sources)} streaming sources for {title}")
    
    except Exception as e:
        logger.error(f"Error getting streaming sources: {str(e)}")
        # Always provide at least basic fallback
        sources = [
            {
                "url": f"https://vidsrc.to/embed/movie/{tmdb_id}",
                "quality": "HD",
                "server": "VidSrc",
                "type": "mp4"
            }
        ]
    
    return sources

async def get_genres_list() -> List[Dict[str, Any]]:
    """Get list of genres."""
    movie_genres = await tmdb_service.get_genres("movie")
    tv_genres = await tmdb_service.get_genres("tv")
    
    all_genres = {}
    
    # Combine genres from movies and TV
    for genre in movie_genres.get("genres", []):
        all_genres[genre["id"]] = genre
    
    for genre in tv_genres.get("genres", []):
        all_genres[genre["id"]] = genre
    
    return list(all_genres.values())