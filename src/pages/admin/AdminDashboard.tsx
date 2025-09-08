import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Users,
  Shield,
  Clock,
  Activity,
  TrendingUp,
  Zap,
  Target,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOSAlertsPanel } from '@/components/admin/SOSAlertsPanel';
import { GroupMapView } from '@/components/admin/GroupMapView';
import { LostFoundDesk } from '@/components/admin/LostFoundDesk';
import { AnalyticsSection } from '@/components/admin/AnalyticsSection';
import { CrowdedAreaAlerts } from '@/components/admin/CrowdedAreaAlerts';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OfflineBanner } from '@/components/admin/OfflineBanner';

interface DashboardStats {
  activeSOS: number;
  totalGroups: number;
  onlineVolunteers: number;
  resolvedAlerts: number;
  crowdDensity: number; // %
  responseTime: number; // minutes
  totalPilgrims: number;
  safetyScore: number; // %
  lastUpdate: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeSOS: 2,              // 1–5 is typical
    totalGroups: 48,           // total groups present
    onlineVolunteers: 22,      // live volunteers
    resolvedAlerts: 243,       // total resolved today
    crowdDensity: 68,          // 0–100 %
    responseTime: 3.9,         // 2–6 mins realistic
    totalPilgrims: 3120,       // total count
    safetyScore: 92,           // 85–98 %
    lastUpdate: new Date().toLocaleTimeString(),
  });

  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 🔄 Live simulation
  useEffect(() => {
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    setIsOffline(offlineMode);

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeSOS: Math.max(0, Math.min(8, prev.activeSOS + (Math.random() > 0.7 ? 1 : Math.random() > 0.5 ? -1 : 0))),
        onlineVolunteers: Math.max(15, Math.min(40, prev.onlineVolunteers + (Math.random() > 0.6 ? 1 : Math.random() > 0.4 ? -1 : 0))),
        crowdDensity: Math.max(30, Math.min(95, prev.crowdDensity + (Math.random() - 0.5) * 5)),
        responseTime: Math.max(2, Math.min(6, prev.responseTime + (Math.random() - 0.5) * 0.3)),
        totalPilgrims: Math.max(2800, Math.min(3500, prev.totalPilgrims + Math.floor((Math.random() - 0.5) * 20))),
        safetyScore: Math.max(85, Math.min(98, prev.safetyScore + (Math.random() - 0.5) * 1)),
        resolvedAlerts: prev.resolvedAlerts + (Math.random() > 0.85 ? 1 : 0),
        lastUpdate: new Date().toLocaleTimeString(),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats(prev => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }));
    setIsRefreshing(false);
  };

  // 📊 Stat Cards
  const statCards = [
    {
      title: 'Total Pilgrims',
      value: stats.totalPilgrims,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-blue-600/20',
      trend: `${stats.totalGroups} groups`,
      trendIcon: Users,
      borderColor: 'border-blue-200',
    },
    {
      title: 'Active SOS',
      value: stats.activeSOS,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-500/10 to-red-600/20',
      trend: stats.activeSOS > 5 ? 'High priority' : 'Under control',
      trendIcon: TrendingUp,
      borderColor: 'border-red-200',
      isUrgent: stats.activeSOS > 5,
    },
    {
      title: 'Response Time',
      value: stats.responseTime,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/20',
      trend: stats.responseTime < 5 ? 'Excellent' : 'Needs attention',
      trendIcon: Clock,
      borderColor: 'border-purple-200',
    },
    {
      title: 'Resolved Today',
      value: stats.resolvedAlerts,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/20',
      trend: '≈94% success rate',
      trendIcon: TrendingUp,
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AdminHeader />
      {isOffline && <OfflineBanner />}

      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* ✅ Top Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-primary text-white p-8 lg:p-12 admin-card-hover"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 font-heading">
                  Control Center
                </h1>
                <Badge className="bg-white/20 text-white border-white/30">Live Monitoring</Badge>
              </div>
              <p className="text-white/90 text-lg max-w-2xl font-medium">
                Real-time monitoring of {stats.totalPilgrims.toLocaleString()} pilgrims across {stats.totalGroups} groups
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end space-y-4">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="secondary"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover-scale font-semibold"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <div className="text-center text-white/80 text-sm font-medium">
                Last updated: {stats.lastUpdate}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ✅ Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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
                  <Card
                    className={`hover-lift bg-white border-2 ${stat.borderColor} shadow-soft hover:shadow-elegant group-hover:scale-[1.02] transition-all duration-300 admin-card-hover ${
                      stat.isUrgent ? 'ring-2 ring-red-200 animate-pulse' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <IconComponent className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl lg:text-3xl font-bold text-foreground leading-none">
                            {typeof stat.value === 'number' && !Number.isInteger(stat.value)
                              ? stat.value.toFixed(1)
                              : stat.value.toLocaleString()}
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

        {/* ✅ Tabs & Sections */}
        <Card className="bg-white border-2 border-gray-100 shadow-elegant admin-card-hover">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
            <div className="p-4 lg:p-6 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground font-heading">Control Dashboard</h2>
                  <p className="text-muted-foreground text-sm font-medium">
                    Monitor and manage all safety operations
                  </p>
                </div>
                <TabsList className="relative w-full lg:w-auto overflow-x-auto bg-gray-50/80 p-1 rounded-xl ring-1 ring-gray-200/60 shadow-inner flex gap-1">
                  {['overview', 'sos', 'groups', 'lost-found', 'crowd-alerts', 'analytics'].map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="relative text-xs lg:text-sm whitespace-nowrap rounded-lg px-4 py-2 min-w-max transition-all duration-200 ease-out hover:bg-white/70 hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:scale-[1.02]"
                    >
                      {activeTab === tab && (
                        <motion.span
                          layoutId="activeTabBubble"
                          className="absolute inset-0 rounded-lg bg-white shadow-sm"
                        />
                      )}
                      <span className="relative z-10">{tab.replace('-', ' ').toUpperCase()}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid gap-6">
                  {/* Overview mini cards */}
                  {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { title: 'Emergency Alert', icon: AlertTriangle, color: 'bg-red-500', count: stats.activeSOS },
                      { title: 'Active Groups', icon: Users, color: 'bg-blue-500', count: stats.totalGroups },
                      { title: 'Volunteers', icon: Shield, color: 'bg-green-500', count: stats.onlineVolunteers },
                      { title: 'Safety Score', icon: Target, color: 'bg-purple-500', count: stats.safetyScore },
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
                          <Card className="cursor-pointer hover:scale-105 transition-transform duration-200 border-0 shadow-soft hover:shadow-elegant admin-card-hover">
                            <CardContent className="p-4 text-center">
                              <div
                                className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                              >
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-foreground mb-1">
                                {typeof item.count === 'number' && !Number.isInteger(item.count)
                                  ? item.count.toFixed(1)
                                  : item.count.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">{item.title}</div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div> */}

                  {/* SOS & Crowd Alerts */}
                  <div className="flex justify-between gap-4">
                    <motion.div
                      className="w-1/2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <SOSAlertsPanel />
                    </motion.div>
                    <motion.div
                      className="w-1/2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <CrowdedAreaAlerts />
                    </motion.div>
                  </div>

                  {/* Map */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <GroupMapView />
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="sos" className="mt-0">
                <SOSAlertsPanel expanded />
              </TabsContent>

              <TabsContent value="groups" className="mt-0">
                <GroupMapView expanded />
              </TabsContent>

              <TabsContent value="lost-found" className="mt-0">
                <LostFoundDesk />
              </TabsContent>

              <TabsContent value="crowd-alerts" className="mt-0">
                <CrowdedAreaAlerts expanded />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <AnalyticsSection />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Enhanced Footer with Real-time Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-elegant admin-card-hover"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-success"></div>
              <div>
                <div className="font-semibold text-foreground font-heading">System Status</div>
                <div className="text-sm text-muted-foreground font-medium">All systems operational</div>
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