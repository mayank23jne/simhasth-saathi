import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Users, MapPin, Shield, Clock, Activity, Bell, Search, TrendingUp, Zap, Target, ChevronRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  responseTime: number;
  totalPilgrims: number;
  safetyScore: number;
  lastUpdate: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeSOS: 3,
    totalGroups: 42,
    onlineVolunteers: 18,
    resolvedAlerts: 156,
    crowdDensity: 75,
    responseTime: 4.2,
    totalPilgrims: 2847,
    safetyScore: 94,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check offline mode
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    setIsOffline(offlineMode);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeSOS: Math.max(0, prev.activeSOS + (Math.random() > 0.8 ? 1 : Math.random() > 0.6 ? -1 : 0)),
        onlineVolunteers: Math.max(12, prev.onlineVolunteers + (Math.random() > 0.7 ? 1 : Math.random() > 0.3 ? -1 : 0)),
        crowdDensity: Math.max(20, Math.min(100, prev.crowdDensity + (Math.random() - 0.5) * 8)),
        responseTime: Math.max(2, prev.responseTime + (Math.random() - 0.5) * 0.5),
        totalPilgrims: Math.max(2500, prev.totalPilgrims + Math.floor((Math.random() - 0.5) * 50)),
        safetyScore: Math.max(85, Math.min(98, prev.safetyScore + (Math.random() - 0.5) * 2)),
        resolvedAlerts: prev.resolvedAlerts + (Math.random() > 0.9 ? 1 : 0),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats(prev => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }));
    setIsRefreshing(false);
  };

  const statCards = [
    {
      title: 'Active SOS',
      value: stats.activeSOS,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-500/10 to-red-600/20',
      trend: stats.activeSOS > 5 ? 'High priority' : 'Under control',
      trendIcon: TrendingUp,
      borderColor: 'border-red-200',
      isUrgent: stats.activeSOS > 5
    },
    {
      title: 'Safety Score',
      value: `${stats.safetyScore}%`,
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-500/10 to-green-600/20',
      trend: stats.safetyScore > 90 ? 'Excellent' : 'Good',
      trendIcon: Target,
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Pilgrims',
      value: stats.totalPilgrims.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-blue-600/20',
      trend: `${stats.totalGroups} groups`,
      trendIcon: Users,
      borderColor: 'border-blue-200'
    },
    {
      title: 'Response Time',
      value: `${stats.responseTime.toFixed(1)}m`,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/20',
      trend: stats.responseTime < 5 ? 'Excellent' : 'Needs attention',
      trendIcon: Clock,
      borderColor: 'border-purple-200'
    },
    {
      title: 'Online Volunteers',
      value: stats.onlineVolunteers,
      icon: Shield,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/20',
      trend: 'All stations covered',
      trendIcon: Activity,
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Resolved Today',
      value: stats.resolvedAlerts,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/20',
      trend: '94% success rate',
      trendIcon: TrendingUp,
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AdminHeader />
      {isOffline && <OfflineBanner />}
      
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Modern Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-primary text-white p-8 lg:p-12"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">
                Control Center
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Real-time monitoring of {stats.totalPilgrims.toLocaleString()} pilgrims across {stats.totalGroups} groups
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end space-y-4">
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="secondary"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <div className="text-center text-white/80 text-sm">
                Last updated: {stats.lastUpdate}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid with better mobile layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <AnimatePresence>
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              const TrendIcon = stat.trendIcon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Card className={`hover-lift bg-white border-2 ${stat.borderColor} shadow-soft hover:shadow-medium group-hover:scale-[1.02] transition-all duration-300 ${stat.isUrgent ? 'ring-2 ring-red-200 animate-pulse' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl lg:text-3xl font-bold text-foreground leading-none">
                            {stat.value}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {stat.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <TrendIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{stat.trend}</span>
                          </div>
                          {stat.isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Enhanced Main Dashboard Content */}
        <Card className="bg-white border-2 border-gray-100 shadow-medium">
          <Tabs defaultValue="overview" className="space-y-0">
            <div className="p-4 lg:p-6 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                    Control Dashboard
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Monitor and manage all safety operations
                  </p>
                </div>
                <TabsList className="w-full lg:w-auto overflow-x-auto bg-gray-50 p-1 rounded-xl">
                  <TabsTrigger 
                    value="overview" 
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sos"
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    SOS
                  </TabsTrigger>
                  <TabsTrigger 
                    value="groups"
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    Groups
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lost-found"
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    Lost & Found
                  </TabsTrigger>
                  <TabsTrigger 
                    value="geofence"
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    Geo-Fence
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics"
                    className="text-xs lg:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid gap-6">
                  {/* Quick Actions Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { title: 'Emergency Alert', icon: AlertTriangle, color: 'bg-red-500', count: stats.activeSOS },
                      { title: 'Active Groups', icon: Users, color: 'bg-blue-500', count: stats.totalGroups },
                      { title: 'Volunteers', icon: Shield, color: 'bg-green-500', count: stats.onlineVolunteers },
                      { title: 'Safety Score', icon: Target, color: 'bg-purple-500', count: `${stats.safetyScore}%` }
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="group"
                        >
                          <Card className="cursor-pointer hover:scale-105 transition-transform duration-200 border-0 shadow-sm hover:shadow-md">
                            <CardContent className="p-4 text-center">
                              <div className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-foreground mb-1">{item.count}</div>
                              <div className="text-xs text-muted-foreground font-medium">{item.title}</div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Main Content Grid */}
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
                </div>
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

        {/* Enhanced Footer with Real-time Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-soft"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold text-foreground">System Status</div>
                <div className="text-sm text-muted-foreground">All systems operational</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-semibold text-foreground">Last Update</div>
                <div className="text-sm text-muted-foreground">{stats.lastUpdate}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-semibold text-foreground">Data Sync</div>
                <div className="text-sm text-muted-foreground">Real-time monitoring active</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};