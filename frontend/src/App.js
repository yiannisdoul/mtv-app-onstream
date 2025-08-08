import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { usePWA } from "./hooks/usePWA";

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
  const { isOnline, isInstalled } = usePWA();

  // Add PWA meta tags and theme
  useEffect(() => {
    // Set theme color for PWA
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = "#ef4444";

    // Set viewport for mobile PWA
    let metaViewport = document.querySelector("meta[name=viewport]");
    if (!metaViewport) {
      metaViewport = document.createElement("meta");
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = "width=device-width, initial-scale=1.0, viewport-fit=cover";

    // Add apple-mobile-web-app tags for iOS
    const appleTags = [
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "OnStream" }
    ];

    appleTags.forEach(tag => {
      let existingTag = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existingTag) {
        existingTag = document.createElement("meta");
        existingTag.name = tag.name;
        document.head.appendChild(existingTag);
      }
      existingTag.content = tag.content;
    });

    // Add apple-touch-icon
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = "/icons/icon-192x192.png";
      document.head.appendChild(appleIcon);
    }

    // Update document title for PWA
    document.title = "OnStream - Free Movies & TV Shows";
  }, []);

  return (
    <AuthProvider>
      <div className="App bg-gray-900 min-h-screen">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
            📶 You're offline. Some features may not work.
          </div>
        )}
        
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
          
          {/* PWA Install Prompt (only show if not installed) */}
          {!isInstalled && <PWAInstallPrompt />}
          
          {/* Toast notifications */}
          <Toaster />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;