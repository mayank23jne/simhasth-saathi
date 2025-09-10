import React, { useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import {
  Users,
  MapPin,
  Shield,
  AlertTriangle,
  Clock,
  Navigation,
  Share,
  QrCode,
  Copy
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DashboardProps {
  groupCode: string;
}

const Dashboard: React.FC<DashboardProps> = ({ groupCode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mockGroupMembers = useMemo(() => ([
    { name: 'राम शर्मा', status: 'safe', lastSeen: '2 min ago' },
    { name: 'सीता देवी', status: 'safe', lastSeen: '5 min ago' },
    { name: 'लक्ष्मण कुमार', status: 'safe', lastSeen: '1 min ago' },
  ]), []);

  const copyGroupCode = () => {
    if (!groupCode) return;
    navigator.clipboard.writeText(groupCode);
    toast.success(t('copied') || 'Copied');
  };

  const shareGroupLocation = () => {
    toast.success(t('locationShared') || 'Location shared');
  };

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-saffron-light/30 via-background to-sky-blue-light/30">
      <div className="container-mobile sm:container-tablet lg:container-desktop space-y-4 sm:space-y-6 py-4 sm:py-6">
        {/* Hero Header */}
        {/* <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm card-interactive rounded-lg sm:rounded-xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-responsive-xl font-semibold text-foreground font-heading">{t('yourGroup')}</h1>
                <p className="text-responsive-xs text-muted-foreground">{t('stayConnected') || 'Stay connected and safe with your group'}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/60 shadow-sm">
                  <span className="text-xs font-mono text-foreground">{groupCode}</span>
                  <button className="p-1 rounded-md hover:bg-background/60 focus-ring" onClick={copyGroupCode} aria-label="Copy group code">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status="safe" size="sm" />
                <span className="text-xs text-muted-foreground">{t('allSafe')}</span>
              </div>
            </div>
          </div>
        </Card> */}
        {/* Group Status Card */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm card-subtle rounded-lg sm:rounded-xl">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-responsive-lg font-semibold text-foreground font-heading">{t('groupStatus')}</h2>
                <span className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/60 border border-border/60 text-xs font-mono text-foreground">
                  {groupCode}
                </span>
              </div>
              <StatusIndicator status="safe" size="sm" />
            </div>

            <div className="bg-accent/30 p-3 sm:p-4 rounded-lg transition-all duration-200 hover:bg-accent/40">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-responsive-sm font-medium text-foreground">
                  {t('yourGroup')} • {mockGroupMembers.length} {t('members')}
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {mockGroupMembers.map((member, index) => (
                  <div 
                    key={member.name} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-background/50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-responsive-xs font-medium text-foreground">{member.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{member.lastSeen}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
                <span className="text-xs text-muted-foreground">{t('lastUpdate')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-responsive-lg font-semibold text-foreground font-heading">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-danger hover:bg-danger/90 text-white shadow-medium touch-button focus-ring active:scale-95 transition-all duration-200"
              onClick={() => navigate('/sos')}
              aria-label="Emergency SOS Alert"
            >
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium">SOS</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-secondary hover:bg-secondary/90 shadow-medium touch-button focus-ring active:scale-95 transition-all duration-200"
              onClick={() => navigate('/map')}
              aria-label="View Group on Map"
            >
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium">{t('findGroup')}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-card hover:bg-background/80 shadow-soft touch-button focus-ring active:scale-95 transition-all duration-200"
              onClick={shareGroupLocation}
              aria-label="Share Current Location"
            >
              <Share className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium">{t('shareLocation')}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-card hover:bg-background/80 shadow-soft touch-button focus-ring active:scale-95 transition-all duration-200"
              onClick={() => navigate('/profile')}
              aria-label="Show My QR Code"
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium">{t('myQR') || 'My QR'}</span>
            </Button>
          </div>
        </div>

        {/* Service Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-responsive-lg font-semibold text-foreground font-heading">Services</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <Card className="border-card-border shadow-soft bg-card/95 backdrop-blur-sm card-interactive rounded-lg sm:rounded-xl overflow-hidden">
              <button 
                className="w-full text-left p-4 sm:p-5 focus-ring transition-all duration-200" 
                onClick={() => navigate('/sos')}
                aria-label="Access Emergency Help Services"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg transition-transform duration-200 group-hover:scale-110">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-responsive-sm font-semibold text-foreground mb-1">{t('emergencyHelp')}</h3>
                    <p className="text-responsive-xs text-muted-foreground">Police, Medical, Volunteers</p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            </Card>

            <Card className="border-card-border shadow-soft bg-card/95 backdrop-blur-sm card-interactive rounded-lg sm:rounded-xl overflow-hidden">
              <button 
                className="w-full text-left p-4 sm:p-5 focus-ring transition-all duration-200" 
                onClick={() => navigate('/helpdesk')}
                aria-label="Access Helpdesk Services"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-sky-blue/10 p-3 rounded-lg transition-transform duration-200 group-hover:scale-110">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-sky-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-responsive-sm font-semibold text-foreground mb-1">{t('helpdesk')}</h3>
                    <p className="text-responsive-xs text-muted-foreground">Lost & Found, Information</p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm card-subtle rounded-lg sm:rounded-xl">
          <h2 className="text-responsive-lg font-semibold text-foreground mb-3 sm:mb-4 font-heading">{t('recentActivity')}</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg transition-all duration-200 hover:bg-success/15">
              <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <p className="text-responsive-xs font-medium text-foreground">{t('allSafe')}</p>
                <p className="text-xs text-muted-foreground">All group members checked in</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Now</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default memo(Dashboard);
