import React, { useState, useMemo, useCallback, memo } from 'react';
import { User, Users, Phone, MapPin, Settings, Share, Edit, Copy, QrCode, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { QRScanner } from '@/components/QRScanner';
import MyQRModal from '@/components/MyQRModal';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shareLocation, setShareLocation] = useState(true);
  const [scannerMode, setScannerMode] = useState<'member' | 'lost_found' | 'general'>('member');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const members = useAppStore(s => s.members);
  const addMember = useAppStore(s => s.addMember);
  const removeMemberFromStore = useAppStore(s => s.removeMember);
  const clearMembers = useAppStore(s => s.clearMembers);
  const userId = useAppStore(s => s.userId);

  const userProfile = useMemo(() => ({
    name: 'राम प्रकाश शर्मा',
    age: 68,
    groupId: 'GRP-2024-001',
    phone: '+91 98765 43210',
    emergencyContacts: [
      { name: 'अजय शर्मा (बेटा)', phone: '+91 98765 43211', relation: 'पुत्र' },
      { name: 'प्रिया शर्मा (बहू)', phone: '+91 98765 43212', relation: 'पुत्रवधू' }
    ]
  }), []);

  const mockMembers = useMemo(() => ([
    { id: 'MEM001', name: 'Ravi Sharma', phone: '+91 90000 00001', groupCode: 'GRP-2024-001' },
    { id: 'MEM002', name: 'Sita Devi', phone: '+91 90000 00002', groupCode: 'GRP-2024-001' },
    { id: 'MEM003', name: 'Mohan Lal', phone: '+91 90000 00003', groupCode: 'GRP-2024-001' },
    { id: 'MEM004', name: 'Radha', phone: '+91 90000 00004', groupCode: 'GRP-2024-001' },
  ]), []);

  // Members now come from global store; persistence handled by store

  const handleShareLocation = useCallback(() => {
    const message = `${t('locationMessage')} - ${userProfile.name}`;
    console.log('Sharing location via SMS:', message);
  }, [t, userProfile.name]);

  const copyGroupId = useCallback(() => {
    navigator.clipboard.writeText(userProfile.groupId);
  }, [userProfile.groupId]);

  const handleScanResult = useCallback((result: any) => {
    setScannedResult(result);
    if (result.type === 'member') {
      const exists = members.some(m => m.id === result.id || (m.phone && result.phone && m.phone === result.phone));
      if (exists) {
        toast('Member already added');
        return;
      }
      addMember({ id: result.id, name: result.name, phone: result.phone, groupCode: result.groupCode });
      toast.success('Member added');
    }
    // For volunteer mode, future: show full info modal
  }, [members, addMember]);

  const removeMember = (id: string) => {
    removeMemberFromStore(id);
  };

  const clearAllMembers = () => {
    clearMembers();
    toast('All members cleared');
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-subtle">
      <div className="px-responsive py-responsive space-y-responsive animate-fade-in">
        {/* User Info Card - Enhanced responsive */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 card-interactive">
          <CardContent className="p-responsive">
            <div className="flex items-center gap-responsive mb-responsive">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-responsive-lg bg-primary/10 text-primary font-semibold">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-responsive-base font-bold text-foreground truncate">{userProfile.name}</h2>
                <p className="text-responsive-sm text-muted-foreground">{t('age')}: {userProfile.age}</p>
                <div className="flex items-center gap-sm mt-sm">
                  <StatusIndicator status="safe" size="sm" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                <Button variant="outline" size="sm" className="h-touch w-touch p-0 hover:scale-110 transition-transform duration-200 focus-ring" aria-label="Edit profile">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-touch w-touch p-0 hover:scale-110 transition-transform duration-200 focus-ring" onClick={() => setQrModalOpen(true)} title="Show My QR" aria-label="Show QR code">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-md">
              <div className="flex items-center gap-md">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{userProfile.phone}</span>
              </div>

              <div className="flex items-center gap-md">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('groupId')}: {userProfile.groupId}</span>
                <Button variant="ghost" size="sm" onClick={copyGroupId} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ResponsiveContainer padding="md" size="full">
              <ResponsiveButton 
                onClick={() => { setScannerMode('member'); setScannerOpen(true); }} 
                className="w-full" 
                touchOptimized
                animated
                icon={<QrCode className="h-4 w-4" />}
              >
                {t('addMember') || 'Add Member'}
              </ResponsiveButton>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base">{t('emergencyContacts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            {userProfile.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-md bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.relation}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs">{contact.phone}</p>
                  <Button variant="ghost" size="sm" className="h-6 px-sm">
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <ResponsiveButton 
              variant="outline" 
              className="w-full" 
              touchOptimized
              animated
              icon={<Phone className="h-4 w-4" />}
            >
              {t('addContact')}
            </ResponsiveButton>
          </CardContent>
        </Card>

        {/* Location Sharing */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base">{t('locationSharing')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-sharing" className="text-sm font-medium">
                  {t('shareLocation')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('shareLocationDesc')}</p>
              </div>
              <Switch
                id="location-sharing"
                checked={shareLocation}
                onCheckedChange={setShareLocation}
              />
            </div>

            <Button
              variant="outline"
              className="w-full h-10"
              onClick={handleShareLocation}
              disabled={!shareLocation}
            >
              <Share className="h-4 w-4 mr-sm" />
              {t('sendLocationSMS')}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {t('offlineLocationInfo')}
            </p>
          </CardContent>
        </Card>

        {/* Group Info */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base">{t('groupInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-md">
            <div className="space-y-sm">
              <div className="flex items-center justify-between text-sm">
                <span>{t('totalMembers')}</span>
                <span className="font-semibold">{members.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('onlineMembers')}</span>
                <span className="font-semibold text-success">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('groupCreated')}</span>
                <span className="text-xs text-muted-foreground">2 दिन पहले</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-10">
              <Users className="h-4 w-4 mr-sm" />
              {t('viewGroupMembers')}
            </Button>
          </CardContent>
        </Card>

        {members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearAllMembers}>Clear All Members</Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {members.map((m) => (
                  <Card key={m.id} className="transition hover:shadow-medium">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-sm text-muted-foreground">{m.phone}</div>
                        <div className="text-xs">Group: {m.groupCode}</div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeMember(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Link */}
        <Button
          variant="outline"
          className="w-full h-12 text-left justify-start"
          onClick={() => window.location.href = '/settings'}
        >
          <Settings className="h-5 w-5 mr-3" />
          <div>
            <p className="font-medium">{t('settings')}</p>
            <p className="text-sm text-muted-foreground">{t('settingsDesc')}</p>
          </div>
        </Button>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full mt-6"
          onClick={() => {
            localStorage.removeItem('groupEnabled');
            localStorage.removeItem('groupCode');
            navigate('/');
          }}
        >
          <User className="h-4 w-4 mr-2" />
          {t('logout')}
        </Button>
      </div>
    <QRScanner
      isOpen={scannerOpen}
      onClose={() => { setScannerOpen(false); setScannedResult(null); }}
      onScanResult={handleScanResult}
      mode={scannerMode}
    />
    {scannedResult && scannedResult.type === 'member' && (
      <Dialog open={!!scannedResult} onOpenChange={() => setScannedResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('scannedMember') || 'Scanned Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="font-medium">{scannedResult.name}</div>
            <div className="text-sm text-muted-foreground">{scannedResult.phone}</div>
            <div className="text-xs">Group: {scannedResult.groupCode}</div>
            <Button size="sm" onClick={() => setScannedResult(null)}>{t('close') || 'Close'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    <MyQRModal
      isOpen={qrModalOpen}
      onClose={() => setQrModalOpen(false)}
      user={{
        id: userId || 'unknown',
        name: userProfile.name,
        groupCode: userProfile.groupId,
        phone: userProfile.phone,
        avatarUrl: undefined // or userProfile.avatarUrl if available
      }}
    />
    </div>

    {/* QR Scanner Modal */}
    </>
  );
};

export default memo(ProfileScreen);
