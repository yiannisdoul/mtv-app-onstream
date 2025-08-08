import React, { useState } from 'react';
import { Grid3X3, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { categories, allContent } from '../mockData';
import ContentGrid from './ContentGrid';

const Browse = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const filteredContent = allContent.filter(item => {
    const categoryMatch = selectedCategory === 'All' || 
      (item.genre && item.genre.includes(selectedCategory));
    
    const yearMatch = selectedYear === 'All' || 
      item.year.toString() === selectedYear;
    
    const typeMatch = selectedType === 'All' || 
      (selectedType === 'Movies' && !item.type) ||
      (selectedType === 'TV Shows' && item.type === 'series');

    return categoryMatch && yearMatch && typeMatch;
  });

  const years = ['All', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016'];

  return (
    <div className="pt-20 pb-20 md:pb-8 bg-gray-900 min-h-screen">
      <div className="px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">Browse</h1>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Filters:</span>
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

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredContent.length} results
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {selectedYear !== 'All' && ` from ${selectedYear}`}
              {selectedType !== 'All' && ` for ${selectedType}`}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <ContentGrid content={filteredContent} />
      </div>
    </div>
  );
};

export default Browse;