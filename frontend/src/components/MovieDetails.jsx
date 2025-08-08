import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Download, Plus, Share, Star, Clock, Calendar, ChevronLeft, Server } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { allContent } from '../mockData';

const MovieDetails = () => {
  const { id } = useParams();
  const [selectedServer, setSelectedServer] = useState('Server 1');
  const [showTrailer, setShowTrailer] = useState(false);
  
  const item = allContent.find(content => content.id === parseInt(id));

  if (!item) {
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

  const handlePlay = () => {
    alert(`Playing ${item.title} from ${selectedServer}...`);
  };

  const handleDownload = () => {
    alert(`Downloading ${item.title} in ${item.quality}...`);
  };

  const handleAddToList = () => {
    alert(`Added ${item.title} to your watchlist!`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
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
            src={item.banner || item.poster}
            alt={item.title}
            className="w-full h-64 md:h-96 object-cover"
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
                  src={item.poster}
                  alt={item.title}
                  className="w-48 md:w-64 h-72 md:h-96 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
                />
              </div>

              {/* Details */}
              <div className="flex-1 max-w-2xl">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {item.title}
                </h1>
                
                <div className="flex flex-wrap items-center space-x-4 mb-4 text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{item.year}</span>
                  </div>
                  {item.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  {item.seasons && (
                    <span>{item.seasons} Season{item.seasons > 1 ? 's' : ''}</span>
                  )}
                  <Badge className="bg-red-600 text-white">
                    {item.quality}
                  </Badge>
                </div>

                {/* Genres */}
                {item.genre && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {item.genre.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-gray-400 text-gray-300"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-gray-300 text-sm md:text-base mb-8 leading-relaxed">
                  {item.description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={handlePlay}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                  >
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Play Now
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

      {/* Server Selection & Trailer */}
      <div className="px-4 max-w-7xl mx-auto space-y-8">
        {/* Server Selection */}
        {item.servers && (
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Select Server
              </h3>
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {item.servers.map(server => (
                    <SelectItem key={server} value={server}>{server}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-gray-400 text-sm">
              Multiple servers available for the best streaming experience
            </p>
          </Card>
        )}

        {/* Trailer Section */}
        {item.trailer && (
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Trailer</h3>
              <Button
                onClick={() => setShowTrailer(!showTrailer)}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
              </Button>
            </div>
            {showTrailer && (
              <div className="relative pb-56 h-0">
                <iframe
                  src={item.trailer}
                  title={`${item.title} Trailer`}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;