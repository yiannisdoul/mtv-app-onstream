import React, { useState } from 'react';
import { Heart, Play, Download, Trash2, Plus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  // Mock watchlist data
  const [watchlist, setWatchlist] = useState([
    {
      id: 1,
      title: "Spider-Man: No Way Home",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
      year: 2021,
      rating: 8.4,
      genre: ["Action", "Adventure", "Sci-Fi"],
      duration: "148 min",
      quality: "HD",
      addedDate: "2024-01-15"
    },
    {
      id: 7,
      title: "Stranger Things",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
      year: 2016,
      rating: 8.7,
      genre: ["Drama", "Fantasy", "Horror"],
      seasons: 4,
      quality: "HD",
      type: "series",
      addedDate: "2024-01-12"
    },
    {
      id: 4,
      title: "Dune",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
      year: 2021,
      rating: 8.0,
      genre: ["Action", "Adventure", "Drama"],
      duration: "155 min",
      quality: "HD",
      addedDate: "2024-01-10"
    }
  ]);

  const handlePlay = (item) => {
    alert(`Playing ${item.title}...`);
  };

  const handleDownload = (item) => {
    alert(`Downloading ${item.title}...`);
  };

  const handleRemoveFromList = (id) => {
    if (window.confirm('Remove this item from your watchlist?')) {
      setWatchlist(watchlist.filter(item => item.id !== id));
    }
  };

  const sortedWatchlist = watchlist.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));

  return (
    <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
      <div className="px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-red-500 fill-current" />
            <h1 className="text-white text-2xl md:text-3xl font-bold">My List</h1>
          </div>
          <p className="text-gray-400">
            {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} in your watchlist
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">Your watchlist is empty</div>
            <div className="text-gray-500 text-sm mb-6">
              Add movies and TV shows you want to watch later
            </div>
            <Link to="/browse">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Browse Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedWatchlist.map((item) => (
              <Card key={item.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:bg-gray-750 transition-colors">
                <div className="flex flex-col sm:flex-row">
                  {/* Poster */}
                  <div className="sm:flex-none">
                    <Link to={`/movie/${item.id}`}>
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full sm:w-32 h-48 sm:h-48 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <Link 
                        to={`/movie/${item.id}`}
                        className="hover:text-red-400 transition-colors"
                      >
                        <h3 className="text-white text-lg font-semibold mb-2">
                          {item.title}
                        </h3>
                      </Link>
                      
                      <div className="flex flex-wrap items-center space-x-4 mb-3 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span>{item.rating}</span>
                        </div>
                        <span>{item.year}</span>
                        {item.type === 'series' ? (
                          <span>{item.seasons} Season{item.seasons > 1 ? 's' : ''}</span>
                        ) : (
                          <span>{item.duration}</span>
                        )}
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                          {item.quality}
                        </span>
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.genre?.map((genre) => (
                          <span
                            key={genre}
                            className="bg-gray-700 text-gray-300 px-2 py-1 text-xs rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      <p className="text-gray-500 text-sm">
                        Added on {new Date(item.addedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={() => handlePlay(item)}
                        className="bg-white text-black hover:bg-gray-200 flex-1 sm:flex-none"
                      >
                        <Play className="h-4 w-4 mr-2 fill-current" />
                        Play
                      </Button>
                      <Button
                        onClick={() => handleDownload(item)}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 sm:flex-none"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleRemoveFromList(item.id)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {watchlist.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Want to add more content to your list?
            </p>
            <Link to="/browse">
              <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                <Plus className="h-4 w-4 mr-2" />
                Browse More Content
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;