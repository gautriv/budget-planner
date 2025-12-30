import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { setSyncStatusCallback, syncWithServer, getMeta } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function SyncStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    syncing: false,
    lastSync: null
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Set up callback for sync status changes
    setSyncStatusCallback((newStatus) => {
      setStatus(prev => ({ ...prev, ...newStatus }));
    });

    // Get last sync time
    const loadLastSync = async () => {
      const lastSync = await getMeta('lastSync');
      if (lastSync) {
        setStatus(prev => ({ ...prev, lastSync }));
      }
    };
    loadLastSync();

    // Listen for online/offline
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = () => {
    if (status.isOnline && !status.syncing) {
      syncWithServer();
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={handleManualSync}
          >
            <AnimatePresence mode="wait">
              {status.syncing ? (
                <motion.div
                  key="syncing"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                >
                  <RefreshCw className="h-4 w-4 text-primary" />
                </motion.div>
              ) : status.isOnline ? (
                <motion.div
                  key="online"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Cloud className="h-4 w-4 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="offline"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <CloudOff className="h-4 w-4 text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Status dot */}
            <span 
              className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                status.isOnline ? 'bg-green-500' : 'bg-amber-500'
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              {status.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-500 font-medium">Offline Mode</span>
                </>
              )}
            </div>
            <div className="text-muted-foreground">
              Last synced: {formatLastSync(status.lastSync)}
            </div>
            {!status.isOnline && (
              <div className="text-muted-foreground">
                Data saved locally. Will sync when online.
              </div>
            )}
            {status.isOnline && !status.syncing && (
              <div className="text-muted-foreground">
                Click to sync now
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

