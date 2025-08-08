import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Download, Plus, Star } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { moviesAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ContentRow = ({ title, content }) => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const handleQuickPlay = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Add to watch history if logged in
      if (isLoggedIn) {
        await userAPI.addToWatchHistory({
          tmdb_id: item.tmdb_id,
          title: item.title,
          poster_path: item.poster_path,
          type: item.type || 'movie'
        });
      }

      // Get streaming sources
      const streamResponse = await moviesAPI.getStreamingSources(item.tmdb_id);
      if (streamResponse.success && streamResponse.data.sources.length > 0) {
        // Navigate to movie details page for better player experience
        window.location.href = `/movie/${item.tmdb_id}?autoplay=true`;
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

  const handleDownload = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to download content.",
        variant: "destructive"
      });
      return;
    }

    // Mock download functionality
    toast({
      title: "Download Started",
      description: `${item.title} has been added to your downloads.`
    });
  };

  const handleAddToList = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
        tmdb_id: item.tmdb_id,
        title: item.title,
        poster_path: item.poster_path,
        type: item.type || 'movie'
      });
      
      toast({
        title: "Success",
        description: `Added ${item.title} to your list!`
      });
    } catch (error) {
      if (error.message.includes('already')) {
        toast({
          title: "Already in List",
          description: `${item.title} is already in your favorites.`
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

  return (
    <div className="space-y-4">
      <h2 className="text-white text-xl md:text-2xl font-semibold">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {content.map((item) => (
          <Link
            key={item.tmdb_id || item.id}
            to={`/movie/${item.tmdb_id || item.id}`}
            className="flex-none group"
          >
            <Card className="w-48 md:w-56 bg-gray-800 border-gray-700 overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img
                  src={item.poster_path}
                  alt={item.title}
                  className="w-full h-72 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop';
                  }}
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => handleQuickPlay(item, e)}
                      size="sm"
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                    <Button
                      onClick={(e) => handleDownload(item, e)}
                      size="sm"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => handleAddToList(item, e)}
                      size="sm"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quality Badge with MTV Branding */}
                <div className="absolute top-2 left-2 mtv-quality-badge px-2 py-1 text-xs rounded font-semibold">
                  HD
                </div>

                {/* Rating */}
                {item.vote_average && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 px-2 py-1 rounded">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-white text-xs">{item.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Type Badge */}
                {item.type && (
                  <div className="absolute bottom-2 left-2 bg-gray-700 text-white px-2 py-1 text-xs rounded uppercase">
                    {item.type}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || 'N/A'}</span>
                  {item.type === 'tv' ? (
                    <span>{item.number_of_seasons || 1}S</span>
                  ) : (
                    <span>{item.runtime ? `${item.runtime}m` : 'Movie'}</span>
                  )}
                </div>
                {item.genres && item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.genres.slice(0, 2).map((g) => (
                      <span
                        key={g.id || g.name}
                        className="bg-gray-700 text-gray-300 px-2 py-1 text-xs rounded"
                      >
                        {g.name || g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContentRow;