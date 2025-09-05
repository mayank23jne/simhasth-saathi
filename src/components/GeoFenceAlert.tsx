import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, MapPin, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';

interface GeofenceAlert {
  id: string;
  member: string;
  zone: string;
  type: 'exit' | 'enter';
  timestamp: number;
  lat?: number;
  lng?: number;
}

interface GeoFenceAlertProps {
  alerts: GeofenceAlert[];
  onDismiss: (id: string) => void;
  onViewLocation: (lat: number, lng: number, label: string) => void;
}

export const GeoFenceAlert: React.FC<GeoFenceAlertProps> = ({ 
  alerts, 
  onDismiss, 
  onViewLocation 
}) => {
  const { t } = useTranslation();
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 z-[1000] space-y-2 max-w-sm mx-auto"
      >
        {alerts.slice(0, 3).map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-warning/50 bg-warning/10 backdrop-blur-md shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-warning/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {alert.type === 'exit' ? 'सुरक्षित क्षेत्र से बाहर' : 'सुरक्षित क्षेत्र में प्रवेश'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.member} • {alert.zone}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alert.timestamp).toLocaleTimeString('hi-IN')}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {expandedAlert === alert.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-warning/20"
                      >
                        <div className="flex gap-2">
                          {alert.lat && alert.lng && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => onViewLocation(alert.lat!, alert.lng!, `${alert.member} Location`)}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              स्थान देखें
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setExpandedAlert(null)}
                          >
                            छुपाएं
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {expandedAlert !== alert.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs mt-1 p-0"
                        onClick={() => setExpandedAlert(alert.id)}
                      >
                        विवरण देखें
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {alerts.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-2 py-1">
              +{alerts.length - 3} और चेतावनी
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};