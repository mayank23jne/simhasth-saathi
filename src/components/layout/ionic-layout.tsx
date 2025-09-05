import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { IonicHeader } from './ionic-header';
import { IonicContent } from './ionic-content';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { useTranslation } from '@/context/TranslationContext';

interface IonicLayoutProps {
  // children optional, kyunki Outlet use karenge
  children?: React.ReactNode;
}

interface RouteConfig {
  title?: string;
  subtitle?: string;
  leftIcon?: 'menu' | 'back' | null;
  rightIcon?: 'notifications' | 'profile' | null;
  showHeader: boolean;
  showBottomNav: boolean;
  showNotificationBadge?: boolean;
}

export const IonicLayout: React.FC<IonicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const routeConfig: Record<string, RouteConfig> = {
    '/dashboard': {
      title: t('welcomeTitle') || 'Simhasth Saathi',
      subtitle: t('welcomeSubtitle'),
      leftIcon: null,
      rightIcon: 'notifications',
      showHeader: true,
      showBottomNav: true,
      showNotificationBadge: true
    },
    '/map': {
      title: t('groupStatus') || 'Group Status',
      leftIcon: 'back',
      rightIcon: 'notifications',
      showHeader: false,
      showBottomNav: true
    },
    '/sos': {
      title: t('sosTitle') || 'Emergency SOS',
      subtitle: t('sosSubtitle'),
      leftIcon: 'back',
      rightIcon: null,
      showHeader: true,
      showBottomNav: true
    },
    '/helpdesk': {
      title: t('helpdeskTitle') || 'Help Center',
      subtitle: t('helpdeskSubtitle'),
      leftIcon: 'back',
      rightIcon: 'notifications',
      showHeader: true,
      showBottomNav: true
    },
    '/profile': {
      title: t('profileTitle') || 'Profile',
      leftIcon: 'back',
      rightIcon: 'notifications',
      showHeader: true,
      showBottomNav: true
    },
    '/settings': {
      title: t('settingsTitle') || 'Settings',
      leftIcon: 'back',
      rightIcon: null,
      showHeader: true,
      showBottomNav: true
    },
    '/notifications': {
      title: t('notificationsTitle') || 'Notifications',
      leftIcon: 'back',
      rightIcon: null,
      showHeader: true,
      showBottomNav: true
    },
    '/': {
      showHeader: false,
      showBottomNav: false
    }
  };

  const currentRoute = routeConfig[location.pathname] || {
    title: 'Simhasth Saathi',
    showHeader: true,
    showBottomNav: true
  };

  const handleLeftClick = () => {
    if (currentRoute.leftIcon === 'back') {
      window.history.back();
    }
  };

  const handleRightClick = () => {
    if (currentRoute.rightIcon === 'notifications') {
      console.log('Open notifications');
    }
  };

  useEffect(() => {
    console.info(location, "current");
  }, [location]);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Fixed Header */}
      {currentRoute.showHeader && (
        <IonicHeader
          title={currentRoute.title || 'Simhasth Saathi'}
          subtitle={currentRoute.subtitle}
          leftIcon={currentRoute.leftIcon}
          rightIcon={currentRoute.rightIcon}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
          showNotificationBadge={currentRoute.showNotificationBadge}
        />
      )}

      {/* Scrollable Content Area */}
      <IonicContent className={`${!currentRoute.showHeader ? 'pt-0' : ''} ${!currentRoute.showBottomNav ? 'pb-0' : 'pb-nav'}`}>
        {/* Agar children diye hain */}
        {children}
        {/* Ya nested routes ke liye */}
        <Outlet />
      </IonicContent>

      {/* Fixed Bottom Navigation */}
      {currentRoute.showBottomNav && (
        <BottomNavigation />
      )}
    </div>
  );
};
