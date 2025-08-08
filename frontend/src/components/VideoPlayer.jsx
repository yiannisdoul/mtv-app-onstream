import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const VideoPlayer = ({ sources, title, onClose }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const hideControlsTimeout = useRef(null);

  const currentSource = sources[currentSourceIndex];

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls) {
      clearTimeout(hideControlsTimeout.current);
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => clearTimeout(hideControlsTimeout.current);
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const switchSource = (index) => {
    setCurrentSourceIndex(index);
    setLoading(true);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load video. Try switching to another server.');
    setLoading(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // If source is an embed URL, use iframe
  const isEmbedUrl = currentSource?.url?.includes('embed') || 
                    currentSource?.url?.includes('vidsrc') || 
                    currentSource?.url?.includes('2embed');

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div 
        className="relative w-full h-full"
        onMouseMove={handleMouseMove}
      >
        {/* Video/Iframe Container */}
        <div className="relative w-full h-full">
          {isEmbedUrl ? (
            <iframe
              ref={iframeRef}
              src={currentSource.url}
              className="w-full h-full"
              allowFullScreen
              frameBorder="0"
              onLoad={() => setLoading(false)}
              onError={handleError}
              title={`${title} - ${currentSource.server}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleError}
              crossOrigin="anonymous"
            >
              <source src={currentSource.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading from {currentSource.server}...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Card className="bg-gray-800 border-gray-700 p-6 text-center max-w-md">
                <div className="text-red-400 mb-4">
                  <RotateCcw className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Playback Error</h3>
                <p className="text-gray-300 text-sm mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Retry
                  </Button>
                  {sources.length > 1 && (
                    <Button
                      onClick={() => switchSource((currentSourceIndex + 1) % sources.length)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Next Server
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        {showControls && !isEmbedUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 flex flex-col justify-between pointer-events-none">
            {/* Top Controls */}
            <div className="flex justify-between items-center p-4 pointer-events-auto">
              <div>
                <h2 className="text-white text-lg font-semibold mb-1">{title}</h2>
                <p className="text-gray-300 text-sm">
                  Playing from {currentSource.server} ({currentSource.quality})
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Center Play Button */}
            {!isPlaying && !loading && (
              <div className="flex-1 flex items-center justify-center pointer-events-auto">
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-6"
                >
                  <Play className="h-12 w-12" />
                </Button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="p-4 space-y-4 pointer-events-auto">
              {/* Progress Bar */}
              <div 
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={togglePlayPause}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-red-600"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Server Selection */}
                  {sources.length > 1 && (
                    <select
                      value={currentSourceIndex}
                      onChange={(e) => switchSource(parseInt(e.target.value))}
                      className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      {sources.map((source, index) => (
                        <option key={index} value={index}>
                          {source.server} ({source.quality})
                        </option>
                      ))}
                    </select>
                  )}

                  <Button
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embed Player Close Button */}
        {isEmbedUrl && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;