import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Browse from "./components/Browse";
import Search from "./components/Search";
import MovieDetails from "./components/MovieDetails";
import Downloads from "./components/Downloads";
import Watchlist from "./components/Watchlist";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="App bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search searchQuery={searchQuery} />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/watchlist" element={<Watchlist />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;