import React from 'react';
import { Bell, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface IonicHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: 'menu' | 'back' | null;
  rightIcon?: 'notifications' | 'profile' | null;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  className?: string;
  showNotificationBadge?: boolean;
}

export const IonicHeader: React.FC<IonicHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftClick,
  onRightClick,
  className,
  showNotificationBadge = false
}) => {
  const renderLeftIcon = () => {
    if (!leftIcon) return <div className="w-10" />; // Spacer
    
    const IconComponent = leftIcon === 'back' ? ArrowLeft : Menu;
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onLeftClick}
        className="h-10 w-10 p-0"
      >
        <IconComponent className="h-5 w-5 text-foreground" />
      </Button>
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return <div className="w-10" />; // Spacer
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRightClick}
        className="h-10 w-10 p-0 relative"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {showNotificationBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full"
          />
        )}
      </Button>
    );
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-md border-b border-card-border",
        "shadow-soft",
        className
      )}
    >
      <div className="h-14 flex items-center justify-between px-lg">
        {renderLeftIcon()}
        
        <div className="flex-1 text-center px-md">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base font-semibold text-foreground leading-tight truncate"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-muted-foreground truncate"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        
        {renderRightIcon()}
      </div>
    </motion.header>
  );
};