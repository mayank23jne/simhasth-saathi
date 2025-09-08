import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, MapPin, Phone, User, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// CORE SAFETY FEATURE: SOS Alerts for religious gatherings like Simhastha 2028
// Supports one-tap emergency alerts to volunteers and police as per project requirements
interface SOSAlert {
  id: string;
  name: string;
  phone: string;
  groupCode: string; // Essential for group-based tracking in religious gatherings
  location: string;
  coordinates: [number, number];
  issue: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  status: 'active' | 'acknowledged' | 'resolved';
  assignedVolunteer?: string;
  emergencyType: 'medical' | 'lost_person' | 'security' | 'crowd_control' | 'other'; // For religious gathering contexts
  smsBackupSent?: boolean; // Offline fallback support as per requirements
}

interface SOSAlertsPanelProps {
  expanded?: boolean;
}

export const SOSAlertsPanel: React.FC<SOSAlertsPanelProps> = ({ expanded = false }) => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  useEffect(() => {
    // SIMHASTHA CONTEXT: Realistic SOS scenarios for religious gatherings
    const dummyAlerts: SOSAlert[] = [
      {
        id: 'sos_001',
        name: 'Priya Sharma',
        phone: '+91 98765 43210',
        groupCode: 'GRP-2024-001',
        location: 'Near Har Ki Pauri',
        coordinates: [29.9457, 78.1642],
        issue: 'Lost child - 8 year old boy in blue shirt',
        priority: 'high',
        timestamp: Date.now() - 300000, // 5 minutes ago
        status: 'active',
        emergencyType: 'lost_person',
        smsBackupSent: true // Offline SMS fallback activated
      },
      {
        id: 'sos_002',
        name: 'Rajesh Kumar',
        phone: '+91 87654 32109',
        groupCode: 'GRP-2024-015',
        location: 'Mansa Devi Temple Area',
        coordinates: [29.9457, 78.1642],
        issue: 'Medical emergency - chest pain',
        priority: 'high',
        timestamp: Date.now() - 600000, // 10 minutes ago
        status: 'acknowledged',
        assignedVolunteer: 'Dr. Singh',
        emergencyType: 'medical',
        smsBackupSent: false
      },
      {
        id: 'sos_003',
        name: 'Anita Devi',
        phone: '+91 76543 21098',
        groupCode: 'GRP-2024-007',
        location: 'Ganga Aarti Ghat',
        coordinates: [29.9457, 78.1642],
        issue: 'Separated from group during crowd surge',
        priority: 'medium',
        timestamp: Date.now() - 900000, // 15 minutes ago
        status: 'active',
        emergencyType: 'crowd_control',
        smsBackupSent: true
      }
    ];

    setAlerts(dummyAlerts);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.groupCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.issue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || alert.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const, assignedVolunteer: 'Current User' }
        : alert
    ));
    toast.success('Alert acknowledged and assigned');
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
    toast.success('Alert marked as resolved');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500';
      case 'acknowledged': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <Card className={`${expanded ? 'h-full' : 'h-96'} border-2 border-red-100 shadow-danger hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">SOS Alerts</div>
                <div className="text-sm text-muted-foreground">
                  {filteredAlerts.filter(a => a.status === 'active').length} urgent · {filteredAlerts.length} total
                </div>
              </div>
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-red-500 text-white">
              {alerts.filter(a => a.status === 'active').length} Active
            </Badge>
            {alerts.filter(a => a.status === 'active').length > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
        
        {expanded && (
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                All ({filteredAlerts.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
                className="text-xs"
              >
                Active ({alerts.filter(a => a.status === 'active').length})
              </Button>
              <Button
                variant={filter === 'acknowledged' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFilter('acknowledged')}
                className="text-xs"
              >
                Acknowledged ({alerts.filter(a => a.status === 'acknowledged').length})
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={`space-y-3 ${expanded ? 'overflow-y-auto h-max' : 'overflow-y-scroll h-72'}`}>
        <AnimatePresence>
          {filteredAlerts.slice(0, expanded ? filteredAlerts.length : 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border-2 rounded-xl space-y-3 hover:shadow-sm transition-all duration-200 ${
                  alert.status === 'active' ? 'border-red-200 bg-red-50/50' : 
                  alert.status === 'acknowledged' ? 'border-yellow-200 bg-yellow-50/50' : 
                  'border-gray-200 bg-gray-50/50'
                }`}
              >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPriorityColor(alert.priority)} text-white text-xs`}>
                      {alert.priority}
                    </Badge>
                    <span className={`text-sm font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{alert.name}</h4>
                  <p className="text-sm text-muted-foreground">{alert.issue}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {alert.groupCode}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {alert.phone}
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <MapPin className="h-3 w-3" />
                  {alert.location}
                </div>
              </div>

              {alert.assignedVolunteer && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Assigned to: </span>
                  <span className="font-medium">{alert.assignedVolunteer}</span>
                </div>
              )}

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
                    Mark Resolved
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  View Location
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No alerts found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};