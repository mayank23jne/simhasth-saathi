import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin, Clock, AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface GeoFenceAlert {
  id: string;
  type: 'entry' | 'exit' | 'restricted';
  zoneName: string;
  personName: string;
  groupCode: string;
  timestamp: number;
  location: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'acknowledged' | 'resolved';
}

interface GeoFenceAlertsProps {
  expanded?: boolean;
}

export const GeoFenceAlerts: React.FC<GeoFenceAlertsProps> = ({ expanded = false }) => {
  const [alerts, setAlerts] = useState<GeoFenceAlert[]>([]);

  useEffect(() => {
    // Load dummy geo-fence alerts
    const dummyAlerts: GeoFenceAlert[] = [
      {
        id: 'gf_001',
        type: 'restricted',
        zoneName: 'VIP Area',
        personName: 'Unknown Person',
        groupCode: 'N/A',
        timestamp: Date.now() - 120000,
        location: 'Near Main Stage',
        severity: 'high',
        status: 'active'
      },
      {
        id: 'gf_002',
        type: 'exit',
        zoneName: 'Safe Zone',
        personName: 'Raj Kumar',
        groupCode: 'GRP-2024-015',
        timestamp: Date.now() - 300000,
        location: 'Emergency Exit Gate 3',
        severity: 'medium',
        status: 'acknowledged'
      },
      {
        id: 'gf_003',
        type: 'entry',
        zoneName: 'Crowded Area Alert',
        personName: 'Group Leader',
        groupCode: 'GRP-2024-001',
        timestamp: Date.now() - 600000,
        location: 'Har Ki Pauri Main Area',
        severity: 'low',
        status: 'resolved'
      }
    ];

    setAlerts(dummyAlerts);

    // Simulate new alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newAlert: GeoFenceAlert = {
          id: `gf_${Date.now()}`,
          type: ['entry', 'exit', 'restricted'][Math.floor(Math.random() * 3)] as 'entry' | 'exit' | 'restricted',
          zoneName: ['VIP Area', 'Safe Zone', 'Restricted Zone', 'Crowd Alert Zone'][Math.floor(Math.random() * 4)],
          personName: ['Unknown Person', 'Group Member', 'Volunteer'][Math.floor(Math.random() * 3)],
          groupCode: `GRP-2024-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
          timestamp: Date.now(),
          location: 'Live Location',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          status: 'active'
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const }
        : alert
    ));
    toast.success('Alert acknowledged');
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
    toast.success('Alert resolved');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restricted': return 'text-red-500';
      case 'exit': return 'text-yellow-500';
      case 'entry': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restricted': return AlertTriangle;
      case 'exit': return MapPin;
      case 'entry': return Shield;
      default: return Shield;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <Card className={expanded ? 'h-full' : 'h-96'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Geo-Fence Alerts
            </CardTitle>
            <CardDescription>
              {alerts.filter(a => a.status === 'active').length} active breaches detected
            </CardDescription>
          </div>
          <Badge variant="outline">
            {alerts.length} Total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 overflow-auto overflow-y-scroll h-72">
        <AnimatePresence>
          {alerts.slice(0, expanded ? alerts.length : 4).map((alert, index) => {
            const TypeIcon = getTypeIcon(alert.type);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border rounded-lg space-y-3 transition-all hover:shadow-sm ${
                  alert.status === 'resolved' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSeverityColor(alert.severity)} text-white text-xs`}>
                        {alert.severity}
                      </Badge>
                      <TypeIcon className={`h-4 w-4 ${getTypeColor(alert.type)}`} />
                      <span className={`text-sm font-medium ${getTypeColor(alert.type)}`}>
                        {alert.type}
                      </span>
                    </div>
                    <h4 className="font-semibold">{alert.zoneName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {alert.personName} - {alert.groupCode}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {alert.location}
                  </div>
                </div>

                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex-1"
                    >
                      Acknowledge
                    </Button>
                  )}
                  {alert.status === 'acknowledged' && (
                    <Button
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      className="flex-1"
                    >
                      Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No geo-fence alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};