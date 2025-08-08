import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Play, Download, Plus, Share, Star, Clock, Calendar, ChevronLeft, Server } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import VideoPlayer from './VideoPlayer';
import { moviesAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MovieDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoplay = searchParams.get('autoplay') === 'true';
  
  const [movie, setMovie] = useState(null);
  const [sources, setSources] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  useEffect(() => {
    if (autoplay && movie && !showPlayer) {
      handlePlay();
    }
  }, [autoplay, movie]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      
      const response = await moviesAPI.getMovieDetails(parseInt(id));
      if (response.success) {
        setMovie(response.data);
        
        // Load streaming sources
        loadStreamingSources(parseInt(id));
      } else {
        toast({
          title: "Error",
          description: "Movie not found.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
      toast({
        title: "Error",
        description: "Failed to load movie details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStreamingSources = async (movieId) => {
    try {
      setSourcesLoading(true);
      
      const response = await moviesAPI.getStreamingSources(movieId);
      if (response.success && response.data.sources) {
        setSources(response.data.sources);
        if (response.data.sources.length > 0) {
          setSelectedServer(response.data.sources[0].server);
        }
      }
    } catch (error) {
      console.error('Error loading streaming sources:', error);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handlePlay = async () => {
    if (sources.length === 0) {
      toast({
        title: "No Sources Available",
        description: "Sorry, no streaming sources are available for this content.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add to watch history if logged in
      if (isLoggedIn && movie) {
        await userAPI.addToWatchHistory({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          type: movie.type || 'movie'
        });
      }

      setShowPlayer(true);
    } catch (error) {
      console.error('Error adding to watch history:', error);
      // Still proceed with playback
      setShowPlayer(true);
    }
  };

  const handleDownload = () => {
    if (!isLoggedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to download content.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download Started",
      description: `${movie.title} has been added to your downloads.`
    });
  };

  const handleAddToList = async () => {
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
        description: `Added ${movie.title} to your watchlist!`
      });
    } catch (error) {
      if (error.message.includes('already')) {
        toast({
          title: "Already in List",
          description: `${movie.title} is already in your favorites.`
        });
      } else {
        console.error('Error adding to favorites:', error);
        toast({
          title: "Error",
          description: "Failed to add to your list. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.overview,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Movie link copied to clipboard!"
      });
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">Content not found</h2>
          <Link to="/" className="text-red-400 hover:text-red-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const selectedSources = sources.filter(s => s.server === selectedServer);
  const playableSources = selectedSources.length > 0 ? selectedSources : sources;

  return (
    <>
      <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="px-4 mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0">
            <img
              src={movie.backdrop_path || movie.poster_path}
              alt={movie.title}
              className="w-full h-64 md:h-96 object-cover"
              onError={(e) => {
                e.target.src = movie.poster_path;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
          </div>
          
          <div className="relative px-4 pt-8 pb-8 md:pt-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
                {/* Poster */}
                <div className="flex-none">
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="w-48 md:w-64 h-72 md:h-96 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 max-w-2xl">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    {movie.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center space-x-4 mb-4 text-gray-300">
                    {movie.vote_average && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || 'N/A'}</span>
                    </div>
                    {movie.runtime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{movie.runtime} min</span>
                      </div>
                    )}
                    {movie.number_of_seasons && (
                      <span>{movie.number_of_seasons} Season{movie.number_of_seasons > 1 ? 's' : ''}</span>
                    )}
                    <Badge className="bg-red-600 text-white">
                      HD
                    </Badge>
                    {movie.type && (
                      <Badge className="bg-gray-700 text-white uppercase">
                        {movie.type}
                      </Badge>
                    )}
                  </div>

                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {movie.genres.map((genre) => (
                        <Badge
                          key={genre.id}
                          variant="outline"
                          className="border-gray-400 text-gray-300"
                        >
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-gray-300 text-sm md:text-base mb-8 leading-relaxed">
                    {movie.overview || 'No description available.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={handlePlay}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                      disabled={sourcesLoading}
                    >
                      <Play className="h-5 w-5 mr-2 fill-current" />
                      {sourcesLoading ? 'Loading...' : 'Play Now'}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="border-gray-400 text-white hover:bg-gray-700 px-8 py-3 text-lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handleAddToList}
                      variant="ghost"
                      className="text-gray-300 hover:text-white px-4 py-3"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      My List
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="ghost"
                      className="text-gray-300 hover:text-white px-4 py-3"
                    >
                      <Share className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Selection & Additional Info */}
        <div className="px-4 max-w-7xl mx-auto space-y-8">
          {/* Server Selection */}
          {sources.length > 0 && (
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Streaming Servers ({sources.length} available)
                </h3>
                {sources.length > 1 && (
                  <Select value={selectedServer} onValueChange={setSelectedServer}>
                    <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {[...new Set(sources.map(s => s.server))].map(server => (
                        <SelectItem key={server} value={server}>{server}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                {sourcesLoading 
                  ? 'Loading streaming sources...' 
                  : `Multiple servers available for the best streaming experience`
                }
              </p>
            </Card>
          )}

          {/* Additional Movie Information */}
          {(movie.vote_count || movie.original_language || movie.popularity) && (
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {movie.vote_count && (
                  <div>
                    <span className="text-gray-400">Votes:</span>
                    <span className="text-white ml-2">{movie.vote_count.toLocaleString()}</span>
                  </div>
                )}
                {movie.original_language && (
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <span className="text-white ml-2 uppercase">{movie.original_language}</span>
                  </div>
                )}
                {movie.popularity && (
                  <div>
                    <span className="text-gray-400">Popularity:</span>
                    <span className="text-white ml-2">{Math.round(movie.popularity)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && playableSources.length > 0 && (
        <VideoPlayer
          sources={playableSources}
          title={movie.title}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
};

export default MovieDetails;