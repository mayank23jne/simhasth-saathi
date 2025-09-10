import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResponsiveButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  responsive?: boolean;
  animated?: boolean;
  touchOptimized?: boolean;
}

export const ResponsiveButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  ResponsiveButtonProps
>(({ 
  children,
  className,
  loading = false,
  icon,
  iconPosition = 'left',
  responsive = true,
  animated = true,
  touchOptimized = true,
  disabled,
  ...props 
}, ref) => {
  const buttonClasses = cn(
    'transition-all duration-200',
    responsive && 'text-responsive-sm',
    touchOptimized && 'touch-target focus-ring',
    animated && 'hover:scale-105 active:scale-95',
    loading && 'pointer-events-none opacity-70',
    className
  );

  const content = (
    <>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </div>
      )}
    </>
  );

  if (animated && !disabled && !loading) {
    return (
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button 
          ref={ref}
          className={buttonClasses} 
          disabled={disabled || loading}
          {...props}
        >
          {content}
        </Button>
      </motion.div>
    );
  }

  return (
    <Button 
      ref={ref}
      className={buttonClasses} 
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </Button>
  );
});