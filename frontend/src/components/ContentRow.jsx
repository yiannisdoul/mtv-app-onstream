import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Download, Plus, Star } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

const ContentRow = ({ title, content }) => {
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

  return (
    <div className="space-y-4">
      <h2 className="text-white text-xl md:text-2xl font-semibold">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {content.map((item) => (
          <Link
            key={item.id}
            to={`/movie/${item.id}`}
            className="flex-none group"
          >
            <Card className="w-48 md:w-56 bg-gray-800 border-gray-700 overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-72 object-cover"
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

              <div className="p-4">
                <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{item.year}</span>
                  {item.type === 'series' ? (
                    <span>{item.seasons} Season{item.seasons > 1 ? 's' : ''}</span>
                  ) : (
                    <span>{item.duration}</span>
                  )}
                </div>
                {item.genre && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.genre.slice(0, 2).map((g) => (
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
    </div>
  );
};

export default ContentRow;