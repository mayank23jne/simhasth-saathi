import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'responsive';
  animated?: boolean;
  center?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
  responsive: 'p-responsive'
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'full',
  padding = 'responsive',
  animated = true,
  center = true
}) => {
  const containerClasses = cn(
    'w-full',
    sizeClasses[size],
    paddingClasses[padding],
    center && 'mx-auto',
    className
  );

  const containerProps = {
    className: containerClasses,
    children
  };

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        {...containerProps}
      />
    );
  }

  return <div {...containerProps} />;
};