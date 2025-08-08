import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const standalone = window.navigator.standalone || 
                     window.matchMedia('(display-mode: standalone)').matches ||
                     window.matchMedia('(display-mode: fullscreen)').matches;
    
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      
      // Show prompt after 10 seconds if not dismissed
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed && !standalone) {
          setShowPrompt(true);
        }
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install prompt if applicable
    if (iOS && !standalone) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 15000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="bg-gray-800 border-gray-700 shadow-xl">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">OS</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Install OnStream</h3>
                <p className="text-gray-400 text-xs">Get the app experience</p>
              </div>
            </div>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isIOS ? (
            // iOS Installation Instructions
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Install OnStream for the best mobile experience:
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">1</span>
                  <span>Tap the Share button in Safari</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">2</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">3</span>
                  <span>Tap "Add" to install OnStream</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          ) : (
            // Android/Chrome Installation
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Install OnStream for offline access and faster loading!
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Smartphone className="h-4 w-4" />
                <span>Works offline • Faster loading • App-like experience</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Not Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;