import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, Clock, MapPin, TrendingUp, Eye, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// CORE SAFETY FEATURE: Crowded Area Alerts for large religious gatherings
// Aligned with project requirements for safety monitoring in religious events like Simhastha 2028
interface CrowdAlert {
  id: string;
  location: string;
  coordinates: [number, number];
  currentDensity: number; // people per sq meter
  capacity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  estimatedPeople: number;
  status: 'monitoring' | 'action_required' | 'resolved';
  recommendedAction?: string;
}

interface CrowdedAreaAlertsProps {
  expanded?: boolean;
}

export const CrowdedAreaAlerts: React.FC<CrowdedAreaAlertsProps> = ({ expanded = false }) => {
  const [alerts, setAlerts] = useState<CrowdAlert[]>([]);

  useEffect(() => {
    // SIMHASTHA CONTEXT: Key areas that require crowd monitoring during religious gatherings
    const dummyCrowdAlerts: CrowdAlert[] = [
      {
        id: 'crowd_001',
        location: 'Har Ki Pauri Main Ghat',
        coordinates: [29.9457, 78.1642],
        currentDensity: 8.5, // Critical crowd density
        capacity: 5000,
        riskLevel: 'critical',
        timestamp: Date.now() - 180000,
        estimatedPeople: 4200,
        status: 'action_required',
        recommendedAction: 'Immediate crowd control required - Deploy additional volunteers'
      },
      {
        id: 'crowd_002', 
        location: 'Mansa Devi Temple Approach',
        coordinates: [29.9457, 78.1642],
        currentDensity: 6.2,
        capacity: 3000,
        riskLevel: 'high',
        timestamp: Date.now() - 300000,
        estimatedPeople: 1860,
        status: 'monitoring',
        recommendedAction: 'Monitor closely - Consider alternate route guidance'
      },
      {
        id: 'crowd_003',
        location: 'Main Aarti Viewing Area',
        coordinates: [29.9457, 78.1642],
        currentDensity: 4.1,
        capacity: 8000,
        riskLevel: 'medium',
        timestamp: Date.now() - 120000,
        estimatedPeople: 3280,
        status: 'monitoring'
      }
    ];

    setAlerts(dummyCrowdAlerts);

    // Simulate real-time crowd density updates for religious gathering monitoring
    const interval = setInterval(() => {
      setAlerts(prev => prev.map(alert => ({
        ...alert,
        currentDensity: Math.max(1, alert.currentDensity + (Math.random() - 0.5) * 2),
        estimatedPeople: Math.max(100, alert.estimatedPeople + Math.floor((Math.random() - 0.5) * 200)),
        timestamp: Date.now(),
        riskLevel: alert.currentDensity > 8 ? 'critical' : 
                  alert.currentDensity > 6 ? 'high' : 
                  alert.currentDensity > 4 ? 'medium' : 'low'
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTakeAction = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
    toast.success('Crowd control action initiated');
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just updated';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const getDensityPercentage = (density: number) => {
    // Standard safe crowd density is 4 people per sq meter for religious gatherings
    return Math.min(100, (density / 4) * 100);
  };

  return (
    <Card className={`${expanded ? 'h-full' : 'h-96'} border-2 border-purple-100 shadow-warning hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">Crowd Density Monitoring</div>
                <div className="text-sm text-muted-foreground">
                  {alerts.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length} high-risk areas · {alerts.length} total monitored
                </div>
              </div>
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-purple-500 text-white">
              {alerts.length} Areas
            </Badge>
            {alerts.filter(a => a.riskLevel === 'critical').length > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-3 ${expanded ? 'overflow-y-auto h-max' : 'overflow-y-scroll h-72'}`}>
        <AnimatePresence>
          {alerts.slice(0, expanded ? alerts.length : 3).map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border-2 rounded-xl space-y-3 hover:shadow-sm transition-all duration-200 ${
                alert.riskLevel === 'critical' ? 'border-red-200 bg-red-50/50' : 
                alert.riskLevel === 'high' ? 'border-orange-200 bg-orange-50/50' : 
                alert.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
                'border-green-200 bg-green-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRiskColor(alert.riskLevel)} text-white text-xs`}>
                      {alert.riskLevel.toUpperCase()}
                    </Badge>
                    <span className={`text-sm font-medium ${getRiskTextColor(alert.riskLevel)}`}>
                      {alert.status === 'action_required' ? 'Action Required' : 'Monitoring'}
                    </span>
                  </div>
                  <h4 className="font-semibold">{alert.location}</h4>
                  <p className="text-sm text-muted-foreground">
                    {alert.estimatedPeople.toLocaleString()} people · {alert.currentDensity.toFixed(1)}/m² density
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>

              {/* Crowd Density Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Crowd Density</span>
                  <span className="font-medium">{getDensityPercentage(alert.currentDensity).toFixed(0)}% of safe limit</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      alert.riskLevel === 'critical' ? 'bg-red-500' :
                      alert.riskLevel === 'high' ? 'bg-orange-500' :
                      alert.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, getDensityPercentage(alert.currentDensity))}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Capacity: {alert.capacity.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Live Location
                </div>
              </div>

              {alert.recommendedAction && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-800">Recommended Action</div>
                      <div className="text-xs text-yellow-700">{alert.recommendedAction}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {alert.status === 'action_required' && (
                  <Button
                    size="sm"
                    onClick={() => handleTakeAction(alert.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Take Action
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View Live
                </Button>
                <Button size="sm" variant="outline">
                  <Navigation className="h-3 w-3 mr-1" />
                  Navigate
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>All areas operating within safe capacity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};