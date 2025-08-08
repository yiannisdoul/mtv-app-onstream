import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";

// Components
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Browse from "./components/Browse";
import Search from "./components/Search";
import MovieDetails from "./components/MovieDetails";
import Downloads from "./components/Downloads";
import Watchlist from "./components/Watchlist";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AuthProvider>
      <div className="App bg-gray-900 min-h-screen">
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Main App Routes */}
            <Route path="/*" element={
              <>
                <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/search" element={<Search searchQuery={searchQuery} />} />
                  <Route path="/movie/:id" element={<MovieDetails />} />
                  <Route 
                    path="/downloads" 
                    element={
                      <ProtectedRoute>
                        <Downloads />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/watchlist" 
                    element={
                      <ProtectedRoute>
                        <Watchlist />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </>
            } />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;