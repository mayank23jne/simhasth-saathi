import React from 'react';
import { Home, Map, AlertTriangle, HelpCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BottomNavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  labelHindi?: string;
}

const navItems: BottomNavItem[] = [
  { path: '/dashboard', icon: Home, label: 'Home', labelHindi: 'होम' },
  { path: '/map', icon: Map, label: 'Map', labelHindi: 'मानचित्र' },
  { path: '/sos', icon: AlertTriangle, label: 'SOS', labelHindi: 'SOS' },
  { path: '/helpdesk', icon: HelpCircle, label: 'Help', labelHindi: 'सहायता' },
  { path: '/profile', icon: User, label: 'Profile', labelHindi: 'प्रोफ़ाइल' },
];

interface BottomNavigationProps {
  currentLanguage?: 'en' | 'hi' | 'mr' | 'sa';
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentLanguage = 'en' 
}) => {
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-card-border shadow-strong z-50"
    >
      <div className="flex items-center justify-around px-sm py-sm h-nav">
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="flex-1"
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center rounded-lg transition-all duration-200',
                  'min-h-touch px-xs py-sm mx-xs relative',
                  'hover:scale-105 active:scale-95',
                  isActive
                    ? 'text-primary bg-accent/80 shadow-soft'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="relative flex items-center justify-center"
                  >
                    <item.icon 
                      className={cn(
                        'h-5 w-5 mb-1 transition-colors duration-200',
                        isActive ? 'text-primary' : 'text-current'
                      )} 
                    />
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -inset-1 bg-primary/15 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.div>
                  <motion.span 
                    className={cn(
                      "text-xs font-medium leading-none transition-all duration-200 text-center",
                      isActive ? "text-primary" : "text-current"
                    )}
                    animate={{ 
                      scale: isActive ? 1.0 : 0.95,
                      fontWeight: isActive ? 600 : 500 
                    }}
                  >
                    {currentLanguage === 'hi' && item.labelHindi ? item.labelHindi : item.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </div>
    </motion.nav>
  );
};