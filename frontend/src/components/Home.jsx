import React, { useState, useEffect } from 'react';
import { Play, Plus, Info, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import ContentRow from './ContentRow';
import VideoPlayer from './VideoPlayer';
import { moviesAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [currentFeatured, setCurrentFeatured] = useState(0);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerData, setPlayerData] = useState(null);

  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Load trending content for featured section
      const trendingResponse = await moviesAPI.getTrending();
      if (trendingResponse.success) {
        const trending = trendingResponse.data.results.slice(0, 5);
        setFeaturedMovies(trending);
        setTrendingContent(trending);
      }

      // Load popular movies
      const moviesResponse = await moviesAPI.getMovies(1, { type: 'movie' });
      if (moviesResponse.success) {
        setPopularMovies(moviesResponse.data.results);
      }

      // Load TV shows
      const tvResponse = await moviesAPI.getMovies(1, { type: 'tv' });
      if (tvResponse.success) {
        setTvShows(tvResponse.data.results);
      }

    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchNow = async (movie) => {
    try {
      // Add to watch history if logged in
      if (isLoggedIn) {
        await userAPI.addToWatchHistory({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          type: movie.type || 'movie'
        });
      }

      // Get streaming sources
      const streamResponse = await moviesAPI.getStreamingSources(movie.tmdb_id);
      if (streamResponse.success && streamResponse.data.sources.length > 0) {
        setPlayerData({
          title: movie.title,
          sources: streamResponse.data.sources
        });
        setShowPlayer(true);
      } else {
        toast({
          title: "No Sources Found",
          description: "Sorry, no streaming sources are available for this content.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting streaming sources:', error);
      toast({
        title: "Error",
        description: "Failed to load streaming sources. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToList = async (movie) => {
    if (!isLoggedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add movies to your list.",
        variant: "destructive"
      });
      return;
    }

    try {
      await userAPI.addToFavorites({
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        type: movie.type || 'movie'
      });
      
      toast({
        title: "Success",
        description: `Added ${movie.title} to your list!`
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error",
        description: "Failed to add to your list. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (featuredMovies.length === 0) {
    return (
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-4">No content available</div>
          <Button onClick={loadContent} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const featured = featuredMovies[currentFeatured];

  return (
    <>
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0">
            <img
              src={featured.backdrop_path || featured.poster_path}
              alt={featured.title}
              className="w-full h-96 md:h-[500px] object-cover"
              onError={(e) => {
                e.target.src = featured.poster_path;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
          </div>
          
          <div className="relative px-4 pt-16 pb-8 md:pt-24 md:pb-16">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-lg md:max-w-xl">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {featured.title}
                </h1>
                <div className="flex items-center space-x-4 mb-4 text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{featured.vote_average?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <span>{featured.release_date?.slice(0, 4) || featured.first_air_date?.slice(0, 4) || 'N/A'}</span>
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                    HD
                  </span>
                  {featured.type && (
                    <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded uppercase">
                      {featured.type}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm md:text-base mb-6 leading-relaxed line-clamp-3">
                  {featured.overview || 'No description available.'}
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={() => handleWatchNow(featured)}
                    className="bg-white text-black hover:bg-gray-200 px-8 py-2 rounded-md font-medium"
                  >
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    Watch Now
                  </Button>
                  <Button
                    onClick={() => handleAddToList(featured)}
                    variant="outline"
                    className="border-gray-400 text-white hover:bg-gray-700 px-8 py-2 rounded-md font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    My List
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-md"
                    onClick={() => window.location.href = `/movie/${featured.tmdb_id}`}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    More Info
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Movie Indicators */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeatured(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentFeatured ? 'bg-white' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {trendingContent.length > 0 && (
              <ContentRow title="Trending Now" content={trendingContent} />
            )}
            {popularMovies.length > 0 && (
              <ContentRow title="Popular Movies" content={popularMovies} />
            )}
            {tvShows.length > 0 && (
              <ContentRow title="TV Series" content={tvShows} />
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && playerData && (
        <VideoPlayer
          sources={playerData.sources}
          title={playerData.title}
          onClose={() => {
            setShowPlayer(false);
            setPlayerData(null);
          }}
        />
      )}
    </>
  );
};

export default Home;