import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Smartphone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// OFFLINE MODE BANNER: Critical for low-connectivity environments as per project requirements
// Simulates SMS fallback functionality for religious gatherings
export const OfflineBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 lg:top-20 z-40 p-4"
    >
      <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-warning admin-card-hover">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <WifiOff className="h-5 w-5 text-yellow-600 animate-pulse" />
            </div>
            <div>
              <div className="font-semibold text-yellow-800 font-heading">
                Offline Mode Active
              </div>
              <div className="text-sm text-yellow-700 font-medium">
                SMS fallback enabled for emergency communications
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-500 text-white hover-scale">
              <Smartphone className="h-3 w-3 mr-1" />
              SMS Ready
            </Badge>
            <Badge className="bg-blue-500 text-white hover-scale">
              <MessageCircle className="h-3 w-3 mr-1" />
              Local Storage
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};