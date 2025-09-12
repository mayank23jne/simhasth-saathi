import React, { useState, useMemo, useCallback, memo } from 'react';
import { User, Users, Phone, Settings, Share, Edit, Copy, QrCode, Trash2 } from 'lucide-react';
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
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

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
      { name: 'अजय शर्मा', phone: '+91 98765 43211', relation: 'पुत्र' },
      { name: 'प्रिया शर्मा', phone: '+91 98765 43212', relation: 'पुत्रवधू' }
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
    toast.success(t('locationShared') || 'Location shared');
  }, [t, userProfile.name]);

  const copyGroupId = useCallback(() => {
    navigator.clipboard.writeText(userProfile.groupId);
    toast.success(t('copied') || 'Copied');
  }, [userProfile.groupId, t]);

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
        {/* User Info Card - Premium layout */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 card-interactive overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-background to-accent/15" />
              <div className="relative p-responsive">
                <div className="flex items-center gap-responsive">
                  <Avatar className="h-14 w-14 sm:h-20 sm:w-20 ring-2 ring-primary/30 shadow-sm">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-responsive-lg bg-primary/10 text-primary font-semibold">
                      {userProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-responsive-lg font-bold text-foreground truncate">{userProfile.name}</h2>
                    <p className="text-responsive-sm text-muted-foreground">{t('age')}: {userProfile.age}</p>
                    <div className="flex items-center gap-sm mt-sm">
                      <StatusIndicator status="safe" size="sm" />
                      <span className="text-xs text-muted-foreground">{t('active') || 'Active'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                    <Button variant="outline" size="sm" className="h-touch w-touch p-0 hover:scale-110 transition-transform duration-200 focus-ring" aria-label="Edit profile">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-md space-y-sm">
                  <div className="flex items-center gap-md">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center gap-md">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('groupId')}: {userProfile.groupId}</span>
                    <Button variant="ghost" size="sm" onClick={copyGroupId} className="h-6 w-6 p-0" aria-label="Copy group id">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <ResponsiveContainer className="mt-md">
                  <div className="grid grid-cols-2 gap-2">
                    <ResponsiveButton 
                      onClick={() => { setScannerMode('member'); setScannerOpen(true); }} 
                      className="w-full"
                      touchOptimized
                      animated
                      icon={<QrCode className="h-4 w-4" />}
                    >
                      {t('addMember') || 'Add Member'}
                    </ResponsiveButton>
                    <ResponsiveButton 
                      variant="outline"
                      className="w-full"
                      touchOptimized
                      animated
                      icon={<QrCode className="h-4 w-4" />}
                      onClick={() => setQrModalOpen(true)}
                    >
                      {t('myQR') || 'My QR'}
                    </ResponsiveButton>
                  </div>
                </ResponsiveContainer>
              </div>
            </div>
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
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">{t('totalMembers')}</div>
                <div className="text-lg font-semibold">{members.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">{t('onlineMembers')}</div>
                <div className="text-lg font-semibold text-success">3</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">{t('groupCreated')}</div>
                <div className="text-xs">2 दिन पहले</div>
              </div>
            </div>

            <Button variant="outline" className="w-full h-10">
              <Users className="h-4 w-4 mr-sm" />
              {t('viewGroupMembers')}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">{t('groupMembers') || 'Group Members'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed">
                <Users className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">{t('noMembersYet') || 'No members yet.'}</p>
                <ResponsiveButton 
                  onClick={() => { setScannerMode('member'); setScannerOpen(true); }}
                  icon={<QrCode className="h-4 w-4" />}
                >
                  {t('addMember') || 'Add Member'}
                </ResponsiveButton>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">{members.length} {t('members') || 'members'}</div>
                  <Button variant="outline" size="sm" onClick={clearAllMembers}>{t('clearAll') || 'Clear All'}</Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {members.map((m) => (
                    <Card key={m.id} className="transition hover:shadow-medium">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{m.name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{m.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{m.phone}</div>
                            <div className="text-xs text-muted-foreground truncate">{t('group') || 'Group'}: {m.groupCode}</div>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => removeMember(m.id)} aria-label="Remove member">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
