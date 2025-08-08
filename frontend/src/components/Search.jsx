import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { allContent, categories } from '../mockData';
import ContentGrid from './ContentGrid';

const Search = ({ searchQuery }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    performSearch();
  }, [localQuery, selectedCategory, selectedType]);

  const performSearch = () => {
    if (!localQuery.trim() && selectedCategory === 'All' && selectedType === 'All') {
      setResults(allContent);
      return;
    }

    const filtered = allContent.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(localQuery.toLowerCase());
      const descriptionMatch = item.description?.toLowerCase().includes(localQuery.toLowerCase()) || false;
      const genreMatch = item.genre?.some(g => g.toLowerCase().includes(localQuery.toLowerCase())) || false;
      
      const queryMatch = !localQuery.trim() || titleMatch || descriptionMatch || genreMatch;
      
      const categoryMatch = selectedCategory === 'All' || 
        (item.genre && item.genre.includes(selectedCategory));
      
      const typeMatch = selectedType === 'All' || 
        (selectedType === 'Movies' && !item.type) ||
        (selectedType === 'TV Shows' && item.type === 'series');

      return queryMatch && categoryMatch && typeMatch;
    });

    setResults(filtered);
  };

  return (
    <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
      <div className="px-4 max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-6">Search</h1>
          
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search movies, TV shows, genres..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="pl-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 text-lg py-3"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Refine search:</span>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="All">All Content</SelectItem>
                <SelectItem value="Movies">Movies</SelectItem>
                <SelectItem value="TV Shows">TV Shows</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="All">All Genres</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mt-6">
            <p className="text-gray-400 text-sm">
              {localQuery ? `Search results for "${localQuery}"` : 'Browse all content'}
              {results.length > 0 && ` - ${results.length} results found`}
            </p>
          </div>
        </div>

        {/* Search Results */}
        {localQuery && results.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No results found</div>
            <div className="text-gray-500 text-sm">
              Try searching with different keywords or check the spelling
            </div>
          </div>
        ) : (
          <ContentGrid content={results} />
        )}
      </div>
    </div>
  );
};

export default Search;