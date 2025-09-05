import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Clock, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  hourlyAlerts: Array<{ hour: string; alerts: number; resolved: number }>;
  groupStats: Array<{ zone: string; groups: number; members: number }>;
  responseTime: Array<{ date: string; avgTime: number }>;
  alertTypes: Array<{ type: string; count: number; color: string }>;
}

export const AnalyticsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [data, setData] = useState<AnalyticsData>({
    hourlyAlerts: [],
    groupStats: [],
    responseTime: [],
    alertTypes: []
  });

  useEffect(() => {
    // Generate dummy analytics data
    const generateData = () => {
      const hourlyAlerts = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        alerts: Math.floor(Math.random() * 20) + 5,
        resolved: Math.floor(Math.random() * 15) + 3
      }));

      const groupStats = [
        { zone: 'Har Ki Pauri', groups: 25, members: 450 },
        { zone: 'Mansa Devi', groups: 18, members: 320 },
        { zone: 'Chandi Devi', groups: 12, members: 280 },
        { zone: 'Daksh Mahadev', groups: 8, members: 150 },
        { zone: 'Maya Devi', groups: 15, members: 200 }
      ];

      const responseTime = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgTime: Math.floor(Math.random() * 10) + 3
      }));

      const alertTypes = [
        { type: 'Medical Emergency', count: 45, color: '#ef4444' },
        { type: 'Lost Person', count: 78, color: '#f59e0b' },
        { type: 'Crowd Control', count: 32, color: '#3b82f6' },
        { type: 'Security', count: 23, color: '#8b5cf6' },
        { type: 'Other', count: 19, color: '#10b981' }
      ];

      setData({ hourlyAlerts, groupStats, responseTime, alertTypes });
    };

    generateData();
    const interval = setInterval(generateData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  const totalAlerts = data.hourlyAlerts.reduce((sum, item) => sum + item.alerts, 0);
  const totalResolved = data.hourlyAlerts.reduce((sum, item) => sum + item.resolved, 0);
  const resolutionRate = totalAlerts > 0 ? Math.round((totalResolved / totalAlerts) * 100) : 0;
  const avgResponseTime = data.responseTime.reduce((sum, item) => sum + item.avgTime, 0) / data.responseTime.length || 0;

  const exportData = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Alerts (24h)', totalAlerts],
      ['Resolved Alerts (24h)', totalResolved],
      ['Resolution Rate', `${resolutionRate}%`],
      ['Avg Response Time', `${avgResponseTime.toFixed(1)} min`],
      ['Total Groups', data.groupStats.reduce((sum, item) => sum + item.groups, 0)],
      ['Total Members', data.groupStats.reduce((sum, item) => sum + item.members, 0)]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simhastha_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Real-time insights and performance metrics
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    size="sm"
                    variant={timeRange === range ? 'default' : 'outline'}
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Alerts',
            value: totalAlerts,
            icon: AlertTriangle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            change: '+12%'
          },
          {
            title: 'Resolution Rate',
            value: `${resolutionRate}%`,
            icon: Users,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            change: '+5%'
          },
          {
            title: 'Avg Response Time',
            value: `${avgResponseTime.toFixed(1)}m`,
            icon: Clock,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            change: '-8%'
          },
          {
            title: 'Active Groups',
            value: data.groupStats.reduce((sum, item) => sum + item.groups, 0),
            icon: Users,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            change: '+3%'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-xs text-green-500 mt-1">
                        {metric.change} from last period
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hourly Alerts Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Resolutions (24h)</CardTitle>
            <CardDescription>Hourly breakdown of alerts received and resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hourlyAlerts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alerts" fill="#ef4444" name="Alerts" />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
            <CardDescription>Average response time over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.responseTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Avg Time (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Zone-wise Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Zone-wise Distribution</CardTitle>
            <CardDescription>Groups and members by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.groupStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="zone" width={100} />
                <Tooltip />
                <Bar dataKey="groups" fill="#8b5cf6" name="Groups" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Types Distribution</CardTitle>
            <CardDescription>Breakdown of alert categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.alertTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.alertTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Performance Summary</CardTitle>
          <CardDescription>Detailed breakdown by geographical zones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Zone</th>
                  <th className="text-right p-2">Groups</th>
                  <th className="text-right p-2">Members</th>
                  <th className="text-right p-2">Avg Group Size</th>
                  <th className="text-right p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.groupStats.map((zone, index) => (
                  <motion.tr
                    key={zone.zone}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 font-medium">{zone.zone}</td>
                    <td className="p-2 text-right">{zone.groups}</td>
                    <td className="p-2 text-right">{zone.members}</td>
                    <td className="p-2 text-right">{Math.round(zone.members / zone.groups)}</td>
                    <td className="p-2 text-right">
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};