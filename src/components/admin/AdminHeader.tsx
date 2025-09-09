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
import { Bell, User, LogOut, Settings, Globe, Wifi, WifiOff, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  const [currentTime, setCurrentTime] = useState(new Date());

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
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
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
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-elegant"
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Enhanced Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-elegant hover-scale">
              <span className="text-white font-bold text-lg lg:text-xl font-heading">S</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl lg:text-2xl font-heading text-foreground">
                Simhastha Saathi
              </h1>
              <p className="text-sm text-muted-foreground font-medium">Admin Control Center</p>
            </div>
            <div className="sm:hidden">
              <h1 className="font-bold text-lg font-heading text-foreground">
                Control Center
              </h1>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Current Time - Desktop Only */}
            <div className="hidden lg:flex flex-col items-end text-right">
              <div className="text-sm font-semibold text-foreground font-heading">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Network Status (desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleOfflineMode}
              className="hidden md:flex hover-scale"
            >
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500 animate-pulse" />
              )}
            </Button>

            {/* Language Selector (desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex hover-scale">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent modal={false} className="dropdown-content font-medium">
                <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-gray-50 font-medium">
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('hi')} className="hover:bg-gray-50 font-medium">
                  हिंदी
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover-scale hidden md:inline-flex">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 text-white pulse-border">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Enhanced User Menu (desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 hover:bg-gray-50 hover-scale">
                  <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-elegant">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  {adminData && (
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-sm font-semibold font-heading">{adminData.username}</span>
                      <Badge 
                        className={`${getRoleColor(adminData.role)} text-white text-xs font-medium`}
                      >
                        {adminData.role}
                      </Badge>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent modal={false} className="dropdown-content min-w-[200px]">
                <div className="p-3 border-b border-gray-100">
                  <div className="font-semibold text-foreground font-heading">{adminData?.username}</div>
                  <div className="text-sm text-muted-foreground font-medium">{adminData?.role}</div>
                </div>
                <DropdownMenuItem className="hover:bg-gray-50 font-medium">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-gray-50 text-red-600 font-medium">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-2 border-b">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{adminData?.username || 'Admin'}</div>
                      <Badge className={`${getRoleColor(adminData?.role || 'admin')} text-white text-xs font-medium`}>
                        {adminData?.role || 'admin'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" onClick={toggleOfflineMode} className="justify-start">
                      {isOnline ? <Wifi className="h-4 w-4 mr-2 text-green-500" /> : <WifiOff className="h-4 w-4 mr-2 text-red-500" />}
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setLanguage('en')}>EN</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setLanguage('hi')}>HI</Button>
                    </div>
                  </div>

                  <Button variant="ghost" className="justify-start relative">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    {notifications > 0 && (
                      <Badge className="ml-auto h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 text-white">
                        {notifications}
                      </Badge>
                    )}
                  </Button>

                  <div className="pt-2 border-t">
                    <Button variant="ghost" className="justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="destructive" className="justify-start w-full mt-1" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};