import React, { useState, useCallback, useEffect } from 'react';
import { Bell, X, AlertTriangle, Users, Shield, MapPin, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';

interface EnhancedNotification {
  id: string;
  type: 'sos' | 'geofence' | 'group' | 'safety' | 'system';
  title: string;
  message: string;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  actionRequired?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  autoHide?: number; // milliseconds
  persistent?: boolean; // doesn't auto-hide
  sound?: boolean;
  vibrate?: boolean;
}

interface NotificationSystemProps {
  notifications: EnhancedNotification[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: string) => void;
  maxVisible?: number;
  position?: 'top' | 'bottom';
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'sos': return AlertTriangle;
    case 'geofence': return MapPin;
    case 'group': return Users;
    case 'safety': return Shield;
    case 'system': return Bell;
    default: return Bell;
  }
};

const getNotificationColor = (type: string, priority: string) => {
  if (priority === 'high') return 'destructive';
  switch (type) {
    case 'sos': return 'destructive';
    case 'geofence': return 'warning';
    case 'group': return 'default';
    case 'safety': return 'secondary';
    case 'system': return 'outline';
    default: return 'default';
  }
};

export const EnhancedNotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  onAction,
  maxVisible = 3,
  position = 'top'
}) => {
  const { t } = useTranslation();
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Auto-hide notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      if (notification.autoHide && !notification.persistent && !notification.isRead) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.autoHide);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  // Play sound and vibrate for high priority notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (!notification.isRead && notification.priority === 'high') {
        if (notification.sound) {
          // In a real app, you'd play a sound file
          console.log('Playing notification sound');
        }
        if (notification.vibrate && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    });
  }, [notifications]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedNotifications(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback((id: string, action: string) => {
    onAction?.(id, action);
    onMarkAsRead(id);
  }, [onAction, onMarkAsRead]);

  const visibleNotifications = notifications
    .filter(n => !n.isRead)
    .sort((a, b) => {
      // Sort by priority (high first), then by timestamp (newest first)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    })
    .slice(0, maxVisible);

  if (visibleNotifications.length === 0) return null;

  const containerClass = position === 'top' 
    ? 'fixed top-4 left-4 right-4 z-[1100]' 
    : 'fixed bottom-20 left-4 right-4 z-[1100]';

  return (
    <div className={containerClass}>
      <div className="max-w-sm mx-auto space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleNotifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type);
            const colorVariant = getNotificationColor(notification.type, notification.priority);
            const isExpanded = expandedNotifications.has(notification.id);

            return (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  zIndex: visibleNotifications.length - index
                }}
                exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className={`
                  border shadow-lg backdrop-blur-md bg-card/95
                  ${notification.priority === 'high' ? 'border-destructive/50 bg-destructive/5' : ''}
                  ${notification.type === 'geofence' ? 'border-warning/50 bg-warning/5' : ''}
                  ${notification.type === 'group' ? 'border-primary/50 bg-primary/5' : ''}
                `}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${
                        notification.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                        notification.type === 'geofence' ? 'bg-warning/20 text-warning' :
                        notification.type === 'group' ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-1">
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                तुरंत
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => onDismiss(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(notification.timestamp).toLocaleTimeString('hi-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {notification.actionRequired && (
                              <Button
                                size="sm"
                                variant={notification.priority === 'high' ? 'destructive' : 'default'}
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  if (notification.onAction) {
                                    notification.onAction();
                                  } else {
                                    handleAction(notification.id, 'primary');
                                  }
                                }}
                              >
                                {notification.actionLabel || 'कार्रवाई करें'}
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => toggleExpanded(notification.id)}
                            >
                              {isExpanded ? 'छुपाएं' : 'विवरण'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onMarkAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-border"
                            >
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">प्रकार:</span>
                                  <span>{
                                    notification.type === 'sos' ? 'आपातकाल' :
                                    notification.type === 'geofence' ? 'भौगोलिक चेतावनी' :
                                    notification.type === 'group' ? 'समूह अपडेट' :
                                    notification.type === 'safety' ? 'सुरक्षा जानकारी' :
                                    'सिस्टम संदेश'
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">प्राथमिकता:</span>
                                  <span>{
                                    notification.priority === 'high' ? 'उच्च' :
                                    notification.priority === 'medium' ? 'मध्यम' : 'कम'
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">समय:</span>
                                  <span>{new Date(notification.timestamp).toLocaleString('hi-IN')}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Summary for remaining notifications */}
        {notifications.filter(n => !n.isRead).length > maxVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Card className="bg-muted/50 backdrop-blur-sm">
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground">
                  +{notifications.filter(n => !n.isRead).length - maxVisible} और सूचनाएं
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedNotificationSystem;