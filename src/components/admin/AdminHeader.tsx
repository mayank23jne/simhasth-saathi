import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Bell, User, LogOut, Settings, Globe, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useTranslation();
  const [adminData, setAdminData] = useState<any>(null);
  const [notifications, setNotifications] = useState(3);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Get admin data from localStorage
    const authData = localStorage.getItem('adminAuth');
    if (authData) {
      setAdminData(JSON.parse(authData));
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const toggleOfflineMode = () => {
    const currentMode = localStorage.getItem('offlineMode') === 'true';
    localStorage.setItem('offlineMode', (!currentMode).toString());
    toast.info(currentMode ? 'Online mode activated' : 'Offline mode activated');
    window.location.reload();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500 to-red-400';
      case 'volunteer': return 'bg-gradient-to-r from-blue-500 to-blue-400';
      case 'police': return 'bg-gradient-to-r from-green-500 to-green-400';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-400';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-card-border backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Simhastha Saathi</h1>
            <p className="text-xs text-muted-foreground">Admin Control Center</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Network Status */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleOfflineMode}
            className="hidden sm:flex"
          >
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent modal={false} className="bg-card shadow-md rounded-md max-h-60 overflow-y-auto z-50">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('hi')}>
                हिंदी
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {adminData && (
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm">{adminData.username}</span>
                    <Badge 
                      className={`${getRoleColor(adminData.role)} text-white text-xs`}
                    >
                      {adminData.role}
                    </Badge>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent modal={false} className="bg-card shadow-md rounded-md max-h-60 overflow-y-auto z-50">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};