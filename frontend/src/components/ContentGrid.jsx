import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Download, Plus, Star } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

const ContentGrid = ({ content }) => {
  const handleQuickPlay = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    alert(`Playing ${item.title}...`);
  };

  const handleDownload = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    alert(`Downloading ${item.title}...`);
  };

  const handleAddToList = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    alert(`Added ${item.title} to your list!`);
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-lg mb-4">No content found</div>
        <div className="text-gray-500 text-sm">Try adjusting your filters</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {content.map((item) => (
        <Link
          key={item.id}
          to={`/movie/${item.id}`}
          className="group"
        >
          <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:scale-105">
            <div className="relative">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-64 sm:h-72 object-cover"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={(e) => handleQuickPlay(item, e)}
                    size="sm"
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Play className="h-4 w-4 fill-current mr-1" />
                    <span className="hidden sm:inline">Play</span>
                  </Button>
                  <div className="flex space-x-2">
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
              </div>

              {/* Quality Badge */}
              {item.quality && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                  {item.quality}
                </div>
              )}

              {/* Rating */}
              {item.rating && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 px-2 py-1 rounded">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-white text-xs">{item.rating}</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{item.year}</span>
                {item.type === 'series' ? (
                  <span>{item.seasons}S</span>
                ) : (
                  <span>{item.duration?.split(' ')[0]}m</span>
                )}
              </div>
              {item.genre && (
                <div className="flex flex-wrap gap-1">
                  {item.genre.slice(0, 1).map((g) => (
                    <span
                      key={g}
                      className="bg-gray-700 text-gray-300 px-2 py-1 text-xs rounded"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ContentGrid;