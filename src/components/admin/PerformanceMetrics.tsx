import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, TrendingUp, TrendingDown, Zap, Clock, Shield, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricData {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  color: string;
  icon: React.ComponentType<any>;
}

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      label: 'Response Time',
      value: 4.2,
      target: 5.0,
      unit: 'min',
      trend: 'down',
      trendValue: 0.3,
      color: 'text-green-500',
      icon: Zap
    },
    {
      label: 'Safety Score',
      value: 94,
      target: 95,
      unit: '%',
      trend: 'up',
      trendValue: 2,
      color: 'text-blue-500',
      icon: Shield
    },
    {
      label: 'Volunteer Efficiency',
      value: 87,
      target: 90,
      unit: '%',
      trend: 'up',
      trendValue: 5,
      color: 'text-purple-500',
      icon: Users
    },
    {
      label: 'System Uptime',
      value: 99.8,
      target: 99.9,
      unit: '%',
      trend: 'stable',
      trendValue: 0,
      color: 'text-emerald-500',
      icon: Activity
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(
          metric.target + 10,
          metric.value + (Math.random() - 0.5) * 2
        ))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 95) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Gauge;
    }
  };

  const getTrendColor = (trend: string, label: string) => {
    if (label === 'Response Time') {
      return trend === 'down' ? 'text-green-500' : 'text-red-500';
    }
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-blue-500" />
          Performance Metrics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time system performance indicators
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            const TrendIcon = getTrendIcon(metric.trend);
            const progressValue = (metric.value / metric.target) * 100;
            
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${
                      metric.color === 'text-green-500' ? 'from-green-500/10 to-green-600/20' :
                      metric.color === 'text-blue-500' ? 'from-blue-500/10 to-blue-600/20' :
                      metric.color === 'text-purple-500' ? 'from-purple-500/10 to-purple-600/20' :
                      'from-emerald-500/10 to-emerald-600/20'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{metric.label}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {metric.target}{metric.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <TrendIcon className={`h-3 w-3 ${getTrendColor(metric.trend, metric.label)}`} />
                      <span className={`text-xs font-medium ${getTrendColor(metric.trend, metric.label)}`}>
                        {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)}
                      </span>
                    </div>
                    <Badge 
                      variant={progressValue >= 95 ? 'default' : progressValue >= 80 ? 'secondary' : 'destructive'}
                      className="text-xs mt-1"
                    >
                      {progressValue.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={Math.min(100, progressValue)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {metric.value.toFixed(1)}{metric.unit}</span>
                    <span>Target: {metric.target}{metric.unit}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};