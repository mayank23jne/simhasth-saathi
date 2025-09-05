import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const OfflineBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-14 z-40"
    >
      <Alert className="rounded-none border-l-0 border-r-0 bg-yellow-50 border-yellow-200">
        <WifiOff className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Offline Mode Active</strong> - Operating with cached data. Some features may be limited.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};