import React from 'react';
import { Shield, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'safe' | 'warning' | 'danger';

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  safe: {
    icon: ShieldCheck,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    text: 'Safe'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    text: 'Alert'
  },
  danger: {
    icon: Shield,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    text: 'Emergency'
  }
};

const sizeConfig = {
  sm: { iconSize: 'h-4 w-4', padding: 'px-2 py-1', textSize: 'text-xs' },
  md: { iconSize: 'h-5 w-5', padding: 'px-3 py-2', textSize: 'text-sm' },
  lg: { iconSize: 'h-6 w-6', padding: 'px-4 py-3', textSize: 'text-base' }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  size = 'md',
  className
}) => {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeStyle.padding,
        sizeStyle.textSize,
        className
      )}
    >
      <Icon className={sizeStyle.iconSize} />
      <span>{text || config.text}</span>
    </div>
  );
};