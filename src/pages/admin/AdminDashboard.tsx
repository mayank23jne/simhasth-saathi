import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Users, MapPin, Shield, Clock, Activity, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { SOSAlertsPanel } from '@/components/admin/SOSAlertsPanel';
import { GroupMapView } from '@/components/admin/GroupMapView';
import { LostFoundDesk } from '@/components/admin/LostFoundDesk';
import { AnalyticsSection } from '@/components/admin/AnalyticsSection';
import { GeoFenceAlerts } from '@/components/admin/GeoFenceAlerts';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OfflineBanner } from '@/components/admin/OfflineBanner';

interface DashboardStats {
  activeSOS: number;
  totalGroups: number;
  onlineVolunteers: number;
  resolvedAlerts: number;
  crowdDensity: number;
  lastUpdate: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeSOS: 3,
    totalGroups: 42,
    onlineVolunteers: 18,
    resolvedAlerts: 156,
    crowdDensity: 75,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check offline mode
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    setIsOffline(offlineMode);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeSOS: Math.max(0, prev.activeSOS + (Math.random() > 0.7 ? 1 : -1)),
        onlineVolunteers: Math.max(10, prev.onlineVolunteers + (Math.random() > 0.5 ? 1 : -1)),
        crowdDensity: Math.max(0, Math.min(100, prev.crowdDensity + (Math.random() - 0.5) * 10)),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Active SOS',
      value: stats.activeSOS,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-500/10 to-red-600/20',
      trend: '+2 from last hour'
    },
    {
      title: 'Total Groups',
      value: stats.totalGroups,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-blue-600/20',
      trend: '+5 new today'
    },
    {
      title: 'Online Volunteers',
      value: stats.onlineVolunteers,
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-500/10 to-green-600/20',
      trend: 'All stations covered'
    },
    {
      title: 'Resolved Alerts',
      value: stats.resolvedAlerts,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/20',
      trend: '94% resolution rate'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader />
      {isOffline && <OfflineBanner />}
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section with Enhanced Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Simhasth Saathi Control Center
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time safety monitoring and emergency response system
          </p>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="hover-lift bg-gradient-card border-0 shadow-elegant hover:shadow-glow group-hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full inline-block">
                          {stat.trend}
                        </p>
                      </div>
                      <div className={`p-4 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Main Dashboard Content */}
        <Card className="bg-gradient-card border-0 shadow-elegant">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-muted/30 p-1 rounded-2xl backdrop-blur-sm">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="sos"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  SOS Alerts
                </TabsTrigger>
                <TabsTrigger 
                  value="groups"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  Groups
                </TabsTrigger>
                <TabsTrigger 
                  value="lost-found"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  Lost & Found
                </TabsTrigger>
                <TabsTrigger 
                  value="geofence"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  Geo-Fence
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <SOSAlertsPanel />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <GeoFenceAlerts />
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <GroupMapView />
                </motion.div>
              </TabsContent>

              <TabsContent value="sos" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <SOSAlertsPanel expanded />
                </motion.div>
              </TabsContent>

              <TabsContent value="groups" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <GroupMapView expanded />
                </motion.div>
              </TabsContent>

              <TabsContent value="lost-found" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <LostFoundDesk />
                </motion.div>
              </TabsContent>

              <TabsContent value="geofence" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <GeoFenceAlerts expanded />
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnalyticsSection />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Enhanced Footer with Real-time Updates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 text-sm text-muted-foreground bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Clock className="h-4 w-4" />
            <span className="font-medium">Last updated: {stats.lastUpdate}</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="font-medium">System Online</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};