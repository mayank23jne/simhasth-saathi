import React, { useState } from 'react';
import { 
  Globe, 
  Shield, 
  Wifi, 
  MessageSquare, 
  Bell, 
  Eye, 
  Users, 
  ArrowLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from './Header';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    language: 'hi',
    offlineMode: false,
    smsBackup: true,
    notifications: true,
    locationSharing: 'group', // 'group', 'all', 'none'
    autoSOS: false
  });

  const languages = [
    { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृत' }
  ];

  const privacyOptions = [
    { value: 'group', label: 'केवल समूह सदस्य', desc: 'सिर्फ आपका समूह आपकी स्थिति देख सकता है' },
    { value: 'all', label: 'सभी उपयोगकर्ता', desc: 'सभी ऐप यूजर आपकी स्थिति देख सकते हैं' },
    { value: 'none', label: 'कोई नहीं', desc: 'कोई भी आपकी स्थिति नहीं देख सकता' }
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <>
    {/* <Header
        title={'सहायता केंद्र'}
        subtitle={'आपकी सुविधा के लिए सभी सेवाएं'}
        showNotifications
        onNotificationClick={() => console.log("Notifications clicked")}
      /> */}
    <div className="min-h-screen bg-background">
      <div className="px-lg py-lg space-y-lg">
        {/* Header */}
        <div className="flex items-center gap-md">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-bold text-foreground">सेटिंग्स</h1>
        </div>
        {/* Language Settings */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base flex items-center gap-sm">
              <Globe className="h-4 w-4" />
              भाषा चयन
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-md">
            <Label className="text-sm">ऐप की भाषा</Label>
            <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-sm">
                      <span>{lang.nativeName}</span>
                      {settings.language === lang.code && <Check className="h-3 w-3 text-primary" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              भाषा बदलने के लिए ऐप को रीस्टार्ट करना होगा
            </p>
          </CardContent>
        </Card>

        {/* Connectivity Settings */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base flex items-center gap-sm">
              <Wifi className="h-4 w-4" />
              कनेक्टिविटी
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode" className="text-sm font-medium">
                  ऑफलाइन मोड
                </Label>
                <p className="text-xs text-muted-foreground">इंटरनेट न होने पर भी काम करे</p>
              </div>
              <Switch 
                id="offline-mode"
                checked={settings.offlineMode}
                onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-backup" className="text-sm font-medium">
                  SMS बैकअप
                </Label>
                <p className="text-xs text-muted-foreground">ऑफलाइन में SMS के द्वारा अलर्ट</p>
              </div>
              <Switch 
                id="sms-backup"
                checked={settings.smsBackup}
                onCheckedChange={(checked) => updateSetting('smsBackup', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base flex items-center gap-sm">
              <Shield className="h-4 w-4" />
              गोपनीयता नियंत्रण
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-lg">
            <div>
              <Label className="text-sm font-medium mb-md block">
                कौन आपकी स्थिति देख सकता है?
              </Label>
              <div className="space-y-md">
                {privacyOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-md">
                    <div 
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                        settings.locationSharing === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                      onClick={() => updateSetting('locationSharing', option.value)}
                    >
                      {settings.locationSharing === option.value && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => updateSetting('locationSharing', option.value)}>
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base flex items-center gap-sm">
              <Bell className="h-4 w-4" />
              सूचनाएं
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium">
                  पुश नोटिफिकेशन
                </Label>
                <p className="text-xs text-muted-foreground">अलर्ट और अपडेट्स पाएं</p>
              </div>
              <Switch 
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sos" className="text-sm font-medium">
                  ऑटो SOS
                </Label>
                <p className="text-xs text-muted-foreground">तेज हिलने पर अपने आप SOS भेजे</p>
              </div>
              <Switch 
                id="auto-sos"
                checked={settings.autoSOS}
                onCheckedChange={(checked) => updateSetting('autoSOS', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="shadow-soft">
          <CardHeader className="pb-md">
            <CardTitle className="text-base">ऐप के बारे में</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            <div className="flex justify-between text-sm">
              <span>वर्जन</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>अंतिम अपडेट</span>
              <span>15 जनवरी, 2024</span>
            </div>
            <div className="text-center pt-md">
              <p className="text-sm text-muted-foreground">
                सिंहस्थ साथी - आपका सुरक्षा साथी
              </p>
              <p className="text-xs text-muted-foreground mt-xs">
                भारत सरकार द्वारा प्रमाणित
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Reset */}
        <Card className="border-destructive/20 shadow-soft">
          <CardContent className="p-lg">
            <Button variant="destructive" className="w-full h-10">
              सभी सेटिंग्स रीसेट करें
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-sm">
              यह सभी व्यक्तिगत सेटिंग्स को वापस डिफ़ॉल्ट में कर देगा
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default SettingsScreen;