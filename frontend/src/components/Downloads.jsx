import React, { useState } from 'react';
import { Download, Trash2, Play, Pause, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

const Downloads = () => {
  // Mock download data
  const [downloads, setDownloads] = useState([
    {
      id: 1,
      title: "Spider-Man: No Way Home",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
      year: 2021,
      quality: "HD",
      size: "2.1 GB",
      progress: 100,
      status: "completed"
    },
    {
      id: 2,
      title: "The Batman",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
      year: 2022,
      quality: "HD",
      size: "2.8 GB",
      progress: 65,
      status: "downloading"
    },
    {
      id: 3,
      title: "Top Gun: Maverick",
      poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
      year: 2022,
      quality: "HD", 
      size: "2.3 GB",
      progress: 0,
      status: "paused"
    }
  ]);

  const handlePlay = (download) => {
    if (download.status === 'completed') {
      alert(`Playing ${download.title} offline...`);
    } else {
      alert('Download not completed yet!');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this download?')) {
      setDownloads(downloads.filter(d => d.id !== id));
    }
  };

  const handlePauseResume = (id) => {
    setDownloads(downloads.map(download => 
      download.id === id 
        ? { ...download, status: download.status === 'downloading' ? 'paused' : 'downloading' }
        : download
    ));
  };

  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const activeDownloads = downloads.filter(d => d.status !== 'completed');

  const getTotalSize = () => {
    return downloads
      .filter(d => d.status === 'completed')
      .reduce((total, d) => total + parseFloat(d.size), 0)
      .toFixed(1);
  };

  return (
    <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
      <div className="px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">Downloads</h1>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>{downloads.length} total downloads</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{completedDownloads.length} completed</span>
            </div>
            <div>
              <span>Storage used: {getTotalSize()} GB</span>
            </div>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-16">
            <Download className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No downloads yet</div>
            <div className="text-gray-500 text-sm">
              Download movies and TV shows to watch offline
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Downloads */}
            {activeDownloads.length > 0 && (
              <div>
                <h2 className="text-white text-xl font-semibold mb-4">
                  Active Downloads ({activeDownloads.length})
                </h2>
                <div className="space-y-4">
                  {activeDownloads.map((download) => (
                    <Card key={download.id} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={download.poster}
                          alt={download.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {download.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                            <span>{download.year}</span>
                            <span>{download.quality}</span>
                            <span>{download.size}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">
                                {download.status === 'downloading' ? 'Downloading...' : 'Paused'}
                              </span>
                              <span className="text-gray-400">
                                {download.progress}%
                              </span>
                            </div>
                            <Progress 
                              value={download.progress} 
                              className="h-2 bg-gray-700"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handlePauseResume(download.id)}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {download.status === 'downloading' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDelete(download.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Downloads */}
            {completedDownloads.length > 0 && (
              <div>
                <h2 className="text-white text-xl font-semibold mb-4">
                  Downloaded ({completedDownloads.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {completedDownloads.map((download) => (
                    <Card key={download.id} className="bg-gray-800 border-gray-700 overflow-hidden group">
                      <div className="relative">
                        <img
                          src={download.poster}
                          alt={download.title}
                          className="w-full h-48 object-cover"
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handlePlay(download)}
                              size="sm"
                              className="bg-white text-black hover:bg-gray-200"
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(download.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Downloaded Badge */}
                        <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Downloaded</span>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {download.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{download.year}</span>
                          <span>{download.size}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Downloads;