import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, Grid3X3, Download, Heart, Menu } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      {/* Top Navigation */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 mtv-gradient rounded flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm tracking-wider">MTV</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl tracking-wide">MTV</span>
              <span className="text-xs text-gray-400 -mt-1">Movies & TV</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-mtv-primary transition-colors"
              />
            </div>
          </form>

          <Button variant="ghost" size="sm" className="md:hidden text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-mtv-primary transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/browse" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-mtv-primary transition-colors">
            <Grid3X3 className="h-5 w-5" />
            <span className="text-xs">Browse</span>
          </Link>
          <Link to="/downloads" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-mtv-primary transition-colors">
            <Download className="h-5 w-5" />
            <span className="text-xs">Downloads</span>
          </Link>
          <Link to="/watchlist" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-mtv-primary transition-colors">
            <Heart className="h-5 w-5" />
            <span className="text-xs">Watchlist</span>
          </Link>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block px-4 pb-3">
        <div className="flex items-center space-x-8 max-w-7xl mx-auto">
          <Link to="/" className="text-white hover:text-mtv-primary transition-colors">
            Home
          </Link>
          <Link to="/browse" className="text-white hover:text-mtv-primary transition-colors">
            Browse
          </Link>
          <Link to="/downloads" className="text-white hover:text-mtv-primary transition-colors">
            Downloads
          </Link>
          <Link to="/watchlist" className="text-white hover:text-mtv-primary transition-colors">
            My List
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;