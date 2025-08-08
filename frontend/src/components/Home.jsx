import React, { useState } from 'react';
import { Play, Plus, Info, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import ContentRow from './ContentRow';
import { featuredMovies, popularMovies, tvShows } from '../mockData';

const Home = () => {
  const [currentFeatured, setCurrentFeatured] = useState(0);
  const featured = featuredMovies[currentFeatured];

  const handleWatchNow = () => {
    // Mock action - in real app would navigate to player
    alert(`Playing ${featured.title}...`);
  };

  const handleAddToList = () => {
    // Mock action - in real app would add to watchlist
    alert(`Added ${featured.title} to your list!`);
  };

  return (
    <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0">
          <img
            src={featured.banner}
            alt={featured.title}
            className="w-full h-96 md:h-[500px] object-cover"
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
                  <span>{featured.rating}</span>
                </div>
                <span>{featured.year}</span>
                <span>{featured.duration}</span>
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                  {featured.quality}
                </span>
              </div>
              <p className="text-gray-300 text-sm md:text-base mb-6 leading-relaxed">
                {featured.description}
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleWatchNow}
                  className="bg-white text-black hover:bg-gray-200 px-8 py-2 rounded-md font-medium"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Watch Now
                </Button>
                <Button
                  onClick={handleAddToList}
                  variant="outline"
                  className="border-gray-400 text-white hover:bg-gray-700 px-8 py-2 rounded-md font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  My List
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-md"
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
          <ContentRow title="Featured Movies" content={featuredMovies} />
          <ContentRow title="Popular Movies" content={popularMovies} />
          <ContentRow title="TV Series" content={tvShows} />
        </div>
      </div>
    </div>
  );
};

export default Home;