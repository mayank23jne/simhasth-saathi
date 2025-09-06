import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendIcon?: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  isUrgent?: boolean;
  index: number;
}

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  icon: IconComponent,
  trend,
  trendIcon: TrendIcon,
  color,
  bgColor,
  borderColor,
  isUrgent = false,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card className={`
        hover-lift bg-white border-2 ${borderColor} shadow-soft hover:shadow-medium 
        group-hover:scale-[1.02] transition-all duration-300 
        ${isUrgent ? 'ring-2 ring-red-200 animate-pulse' : ''}
      `}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
              <IconComponent className={`h-6 w-6 ${color}`} />
            </div>
            <div className="text-right">
              <div className="text-2xl lg:text-3xl font-bold text-foreground leading-none">
                {value}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </h3>
            <div className="flex items-center justify-between">
              {trend && TrendIcon && (
                <div className="flex items-center gap-2 text-xs font-medium">
                  <TrendIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{trend}</span>
                </div>
              )}
              {isUrgent && (
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
};