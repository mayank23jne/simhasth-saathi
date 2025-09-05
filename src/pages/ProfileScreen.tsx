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

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shareLocation, setShareLocation] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState<null | { id: string; name: string; phone: string; groupCode: string }>(null);
  const members = useAppStore(s => s.members);
  const addMember = useAppStore(s => s.addMember);
  const removeMemberFromStore = useAppStore(s => s.removeMember);
  const clearMembers = useAppStore(s => s.clearMembers);

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

  const simulateScan = () => {
    const pick = mockMembers[Math.floor(Math.random() * mockMembers.length)];
    setScanned(pick);
  };

  const addScannedMember = () => {
    if (!scanned) return;
    const exists = members.some(m => m.id === scanned.id || (m.phone && scanned.phone && m.phone === scanned.phone));
    if (exists) {
      toast('Member already added');
      return;
    }
    addMember({ id: scanned.id, name: scanned.name, phone: scanned.phone, groupCode: scanned.groupCode });
    toast.success('Member added');
  };

  const removeMember = (id: string) => {
    removeMemberFromStore(id);
  };

  const clearAllMembers = () => {
    clearMembers();
    toast('All members cleared');
  };

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="px-lg py-lg space-y-lg">
        {/* User Info Card */}
        <Card className="shadow-soft">
          <CardContent className="p-lg">
            <div className="flex items-center gap-lg mb-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-base font-bold text-foreground">{userProfile.name}</h2>
                <p className="text-sm text-muted-foreground">{t('age')}: {userProfile.age}</p>
                <div className="flex items-center gap-sm mt-sm">
                  <StatusIndicator status="safe" size="sm" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-3 w-3" />
              </Button>
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

            <div className="pt-md">
              <Button onClick={() => setScannerOpen(true)} className="w-full h-10" size="sm">
                <QrCode className="h-4 w-4 mr-sm" />
                Add Member
              </Button>
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
            <Button variant="outline" className="w-full mt-md h-10">
              <Phone className="h-4 w-4 mr-sm" />
              {t('addContact')}
            </Button>
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
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Member QR</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="mx-auto w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary">
            <div className="text-center">
              <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-primary font-medium">Camera ready</p>
              <p className="text-sm text-muted-foreground mt-1">Place QR inside the frame</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={simulateScan}>Scan</Button>
            <Button variant="outline" onClick={() => { setScannerOpen(false); setScanned(null); }}>Close</Button>
          </div>

          {scanned && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="font-medium">{scanned.name}</div>
                <div className="text-sm text-muted-foreground">{scanned.phone}</div>
                <div className="text-xs">Group: {scanned.groupCode}</div>
                <div className="pt-2 flex gap-2">
                  <Button size="sm" onClick={addScannedMember}>Add to List</Button>
                  <Button size="sm" variant="outline" onClick={simulateScan}>Scan Again</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </div>

    {/* QR Scanner Modal */}
    </>
  );
};

export default memo(ProfileScreen);
