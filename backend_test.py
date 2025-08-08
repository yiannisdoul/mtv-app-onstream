#!/usr/bin/env python3
"""
OnStream Backend API Test Suite
Tests all backend endpoints for the OnStream movie streaming application.
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://303e39d0-3e5b-4d7f-b0f3-768a6b9ec3c9.preview.emergentagent.com"  # Use production backend URL
API_BASE = f"{BACKEND_URL}/api"

class OnStreamAPITester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.admin_token = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result."""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          headers: Dict = None, auth_required: bool = False) -> Dict[str, Any]:
        """Make HTTP request to API."""
        url = f"{API_BASE}{endpoint}" if endpoint.startswith('/') else f"{API_BASE}/{endpoint}"
        
        # Add auth header if required
        if auth_required and self.auth_token:
            if not headers:
                headers = {}
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with self.session.request(method, url, json=data, headers=headers) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = {"text": await response.text()}
                
                return {
                    "status": response.status,
                    "data": response_data,
                    "headers": dict(response.headers)
                }
        except Exception as e:
            return {
                "status": 0,
                "data": {"error": str(e)},
                "headers": {}
            }
    
    async def test_health_check(self):
        """Test health check endpoint."""
        # Health endpoint is not under /api prefix
        url = f"{BACKEND_URL}/health"
        try:
            async with self.session.get(url) as response:
                data = await response.json()
                if response.status == 200 and data.get("status") == "healthy":
                    self.log_result("Health Check", True, "Backend is healthy", data)
                else:
                    self.log_result("Health Check", False, f"HTTP {response.status}", data)
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
    
    async def test_api_docs(self):
        """Test API documentation endpoint."""
        # API docs endpoint is under /api prefix
        url = f"{BACKEND_URL}/api/docs"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    content_type = response.headers.get("content-type", "")
                    if "text/html" in content_type:
                        self.log_result("API Docs", True, "FastAPI documentation accessible")
                    else:
                        self.log_result("API Docs", False, "Unexpected content type", {"content_type": content_type})
                else:
                    text = await response.text()
                    self.log_result("API Docs", False, f"HTTP {response.status}", {"text": text[:200]})
        except Exception as e:
            self.log_result("API Docs", False, f"Request failed: {str(e)}")
    
    async def test_user_registration(self):
        """Test user registration."""
        test_user = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "SecurePass123!"
        }
        
        response = await self.make_request("POST", "/auth/register", test_user)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                self.log_result("User Registration", True, "User registered successfully", 
                              {"user_id": data.get("data", {}).get("user_id")})
                # Store for login test
                self.test_user = test_user
            else:
                self.log_result("User Registration", False, data.get("message", "Registration failed"), data)
        else:
            self.log_result("User Registration", False, f"HTTP {response['status']}", response["data"])
    
    async def test_user_login(self):
        """Test user login."""
        if not hasattr(self, 'test_user'):
            self.log_result("User Login", False, "No test user available (registration failed)")
            return
        
        login_data = {
            "username": self.test_user["username"],
            "password": self.test_user["password"]
        }
        
        response = await self.make_request("POST", "/auth/login", login_data)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success") and data.get("data", {}).get("access_token"):
                self.auth_token = data["data"]["access_token"]
                self.log_result("User Login", True, "Login successful", 
                              {"token_type": data["data"].get("token_type")})
            else:
                self.log_result("User Login", False, data.get("message", "Login failed"), data)
        else:
            self.log_result("User Login", False, f"HTTP {response['status']}", response["data"])
    
    async def test_admin_login(self):
        """Test admin login."""
        admin_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = await self.make_request("POST", "/auth/login", admin_data)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success") and data.get("data", {}).get("access_token"):
                self.admin_token = data["data"]["access_token"]
                self.log_result("Admin Login", True, "Admin login successful")
            else:
                self.log_result("Admin Login", False, data.get("message", "Admin login failed"), data)
        else:
            self.log_result("Admin Login", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_current_user(self):
        """Test get current user info."""
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return
        
        response = await self.make_request("GET", "/auth/me", auth_required=True)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success") and data.get("data", {}).get("username"):
                self.log_result("Get Current User", True, "User info retrieved successfully",
                              {"username": data["data"]["username"]})
            else:
                self.log_result("Get Current User", False, data.get("message", "Failed to get user info"), data)
        else:
            self.log_result("Get Current User", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_movies(self):
        """Test get movies endpoint."""
        response = await self.make_request("GET", "/movies")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                results = data.get("data", {}).get("results", [])
                self.log_result("Get Movies", True, f"Retrieved {len(results)} movies",
                              {"total_results": data.get("data", {}).get("total_results", 0)})
            else:
                self.log_result("Get Movies", False, data.get("message", "Failed to get movies"), data)
        else:
            self.log_result("Get Movies", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_movie_details(self):
        """Test get movie details endpoint (Fight Club - ID 550)."""
        movie_id = 550  # Fight Club
        response = await self.make_request("GET", f"/movies/{movie_id}")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success") and data.get("data", {}).get("title"):
                movie_title = data["data"]["title"]
                self.log_result("Get Movie Details", True, f"Retrieved details for '{movie_title}'",
                              {"movie_id": movie_id, "title": movie_title})
            else:
                self.log_result("Get Movie Details", False, data.get("message", "Failed to get movie details"), data)
        else:
            self.log_result("Get Movie Details", False, f"HTTP {response['status']}", response["data"])
    
    async def test_search_movies(self):
        """Test search movies endpoint."""
        search_query = "batman"
        response = await self.make_request("GET", f"/search?q={search_query}")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                results = data.get("data", {}).get("results", [])
                self.log_result("Search Movies", True, f"Found {len(results)} results for '{search_query}'",
                              {"query": search_query, "total_results": data.get("data", {}).get("total_results", 0)})
            else:
                self.log_result("Search Movies", False, data.get("message", "Search failed"), data)
        else:
            self.log_result("Search Movies", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_trending(self):
        """Test get trending content endpoint."""
        response = await self.make_request("GET", "/trending")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                results = data.get("data", {}).get("results", [])
                self.log_result("Get Trending", True, f"Retrieved {len(results)} trending items",
                              {"total_results": len(results)})
            else:
                self.log_result("Get Trending", False, data.get("message", "Failed to get trending"), data)
        else:
            self.log_result("Get Trending", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_genres(self):
        """Test get genres endpoint."""
        response = await self.make_request("GET", "/genres")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                genres = data.get("data", {}).get("genres", [])
                self.log_result("Get Genres", True, f"Retrieved {len(genres)} genres",
                              {"genre_count": len(genres)})
            else:
                self.log_result("Get Genres", False, data.get("message", "Failed to get genres"), data)
        else:
            self.log_result("Get Genres", False, f"HTTP {response['status']}", response["data"])
    
    async def test_add_to_favorites(self):
        """Test add to favorites endpoint."""
        if not self.auth_token:
            self.log_result("Add to Favorites", False, "No auth token available")
            return
        
        favorite_data = {
            "tmdb_id": 550,  # Fight Club
            "title": "Fight Club",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "type": "movie"
        }
        
        response = await self.make_request("POST", "/favorites", favorite_data, auth_required=True)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                self.log_result("Add to Favorites", True, "Movie added to favorites successfully")
            else:
                self.log_result("Add to Favorites", False, data.get("message", "Failed to add to favorites"), data)
        else:
            self.log_result("Add to Favorites", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_favorites(self):
        """Test get user favorites endpoint."""
        if not self.auth_token:
            self.log_result("Get Favorites", False, "No auth token available")
            return
        
        response = await self.make_request("GET", "/favorites", auth_required=True)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                results = data.get("data", {}).get("results", [])
                self.log_result("Get Favorites", True, f"Retrieved {len(results)} favorite movies")
            else:
                self.log_result("Get Favorites", False, data.get("message", "Failed to get favorites"), data)
        else:
            self.log_result("Get Favorites", False, f"HTTP {response['status']}", response["data"])
    
    async def test_add_to_watch_history(self):
        """Test add to watch history endpoint."""
        if not self.auth_token:
            self.log_result("Add to Watch History", False, "No auth token available")
            return
        
        watch_data = {
            "tmdb_id": 550,  # Fight Club
            "title": "Fight Club",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "progress": 0.75,
            "type": "movie"
        }
        
        response = await self.make_request("POST", "/watch-history", watch_data, auth_required=True)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                self.log_result("Add to Watch History", True, "Movie added to watch history successfully")
            else:
                self.log_result("Add to Watch History", False, data.get("message", "Failed to add to watch history"), data)
        else:
            self.log_result("Add to Watch History", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_watch_history(self):
        """Test get watch history endpoint."""
        if not self.auth_token:
            self.log_result("Get Watch History", False, "No auth token available")
            return
        
        response = await self.make_request("GET", "/watch-history", auth_required=True)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                results = data.get("data", {}).get("results", [])
                self.log_result("Get Watch History", True, f"Retrieved {len(results)} watch history items")
            else:
                self.log_result("Get Watch History", False, data.get("message", "Failed to get watch history"), data)
        else:
            self.log_result("Get Watch History", False, f"HTTP {response['status']}", response["data"])
    
    async def test_get_movie_streams(self):
        """Test get movie streaming sources endpoint."""
        movie_id = 550  # Fight Club
        response = await self.make_request("GET", f"/movies/{movie_id}/stream")
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                sources = data.get("data", {}).get("sources", [])
                self.log_result("Get Movie Streams", True, f"Retrieved {len(sources)} streaming sources",
                              {"movie_id": movie_id, "source_count": len(sources)})
            else:
                self.log_result("Get Movie Streams", False, data.get("message", "Failed to get streams"), data)
        else:
            self.log_result("Get Movie Streams", False, f"HTTP {response['status']}", response["data"])
    
    async def test_admin_stats(self):
        """Test admin stats endpoint."""
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return
        
        # Use admin token for this request
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = await self.make_request("GET", "/admin/stats", headers=headers)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                stats = data.get("data", {})
                self.log_result("Admin Stats", True, "System stats retrieved successfully",
                              {"total_users": stats.get("total_users", 0),
                               "total_movies_cached": stats.get("total_movies_cached", 0)})
            else:
                self.log_result("Admin Stats", False, data.get("message", "Failed to get stats"), data)
        else:
            self.log_result("Admin Stats", False, f"HTTP {response['status']}", response["data"])
    
    async def test_admin_clear_cache(self):
        """Test admin clear cache endpoint."""
        if not self.admin_token:
            self.log_result("Admin Clear Cache", False, "No admin token available")
            return
        
        # Use admin token for this request
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = await self.make_request("POST", "/admin/cache/clear", headers=headers)
        
        if response["status"] == 200:
            data = response["data"]
            if data.get("success"):
                self.log_result("Admin Clear Cache", True, "Cache clearing initiated successfully")
            else:
                self.log_result("Admin Clear Cache", False, data.get("message", "Failed to clear cache"), data)
        else:
            self.log_result("Admin Clear Cache", False, f"HTTP {response['status']}", response["data"])
    
    async def run_all_tests(self):
        """Run all API tests."""
        print(f"🚀 Starting OnStream Backend API Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"📍 API Base: {API_BASE}")
        print("=" * 60)
        
        # Basic connectivity tests
        await self.test_health_check()
        await self.test_api_docs()
        
        # Authentication tests
        await self.test_user_registration()
        await self.test_user_login()
        await self.test_admin_login()
        await self.test_get_current_user()
        
        # Movie/content tests
        await self.test_get_movies()
        await self.test_get_movie_details()
        await self.test_search_movies()
        await self.test_get_trending()
        await self.test_get_genres()
        await self.test_get_movie_streams()
        
        # User feature tests (require authentication)
        await self.test_add_to_favorites()
        await self.test_get_favorites()
        await self.test_add_to_watch_history()
        await self.test_get_watch_history()
        
        # Admin tests
        await self.test_admin_stats()
        await self.test_admin_clear_cache()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary."""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

async def main():
    """Main test runner."""
    async with OnStreamAPITester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())