import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, Plus, UserPlus, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroup } from '@/context/GroupContext';

interface GroupSetupProps {
  onGroupCreated: (groupCode: string) => void;
  language: string;
}

export const GroupSetup: React.FC<GroupSetupProps> = ({ onGroupCreated, language }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [groupCode, setGroupCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createGroup, joinGroup } = useGroup();

  const texts = {
  en: {
    title: 'Setup Your Group',
    subtitle: 'Connect with family and friends for safety',
    createGroup: 'Create New Group',
    joinGroup: 'Join Existing Group',
    createDesc: 'Generate a unique code for your family/friends',
    joinDesc: 'Enter the group code shared by your group leader',
    generateCode: 'Generate Group Code',
    enterCode: 'Enter Group Code',
    codePlaceholder: 'Enter 6-digit code',
    copyCode: 'Copy Code',
    shareCode: 'Share this code with your family members',
    continue: 'Continue',
    back: 'Back',
    groupCodeLabel: 'Group Code',
    generating: 'Generating...',
    joining: 'Joining...',
    copied: 'Copied!',
  },
  hi: {
    title: 'अपना समूह बनाएं',
    subtitle: 'सुरक्षा के लिए परिवार और दोस्तों से जुड़ें',
    createGroup: 'नया समूह बनाएं',
    joinGroup: 'मौजूदा समूह में शामिल हों',
    createDesc: 'अपने परिवार/दोस्तों के लिए एक विशेष कोड बनाएं',
    joinDesc: 'अपने समूह लीडर द्वारा साझा किया गया समूह कोड दर्ज करें',
    generateCode: 'समूह कोड बनाएं',
    enterCode: 'समूह कोड दर्ज करें',
    codePlaceholder: '6-अंकीय कोड दर्ज करें',
    copyCode: 'कोड कॉपी करें',
    shareCode: 'इस कोड को अपने परिवारजनों के साथ साझा करें',
    continue: 'जारी रखें',
    back: 'वापस',
    groupCodeLabel: 'समूह कोड',
    generating: 'बनाया जा रहा है...',
    joining: 'जुड़ रहे हैं...',
    copied: 'कॉपी हो गया!',
  },
  mr: {
    title: 'आपला गट तयार करा',
    subtitle: 'सुरक्षिततेसाठी कुटुंब आणि मित्रांशी कनेक्ट करा',
    createGroup: 'नवीन गट तयार करा',
    joinGroup: 'विद्यमान गटात सामील व्हा',
    createDesc: 'कुटुंब/मित्रांसाठी एक अद्वितीय कोड तयार करा',
    joinDesc: 'आपल्या गट नेत्याने दिलेला कोड प्रविष्ट करा',
    generateCode: 'गट कोड तयार करा',
    enterCode: 'गट कोड प्रविष्ट करा',
    codePlaceholder: '6-अंकीय कोड प्रविष्ट करा',
    copyCode: 'कोड कॉपी करा',
    shareCode: 'हा कोड आपल्या कुटुंबासोबत शेअर करा',
    continue: 'सुरू ठेवा',
    back: 'मागे',
    groupCodeLabel: 'गट कोड',
    generating: 'तयार करत आहे...',
    joining: 'जोडत आहे...',
    copied: 'कॉपी झाले!',
  },
  sa: {
    title: 'समूह बनाएं',
    subtitle: 'सुरक्षा के लिए परिवार और मित्रों से जुड़ें',
    createGroup: 'नया समूह बनाएं',
    joinGroup: 'मौजूदा समूह में शामिल हों',
    createDesc: 'अपने परिवार/दोस्तों के लिए एक अद्वितीय कोड बनाएं',
    joinDesc: 'समूह नेता द्वारा साझा किया गया कोड दर्ज करें',
    generateCode: 'समूह कोड बनाएं',
    enterCode: 'समूह कोड दर्ज करें',
    codePlaceholder: '6-अंकीय कोड दर्ज करें',
    copyCode: 'कोड कॉपी करें',
    shareCode: 'इस कोड को परिवार के साथ साझा करें',
    continue: 'जारी रखें',
    back: 'वापस',
    groupCodeLabel: 'समूह कोड',
    generating: 'बनाया जा रहा है...',
    joining: 'जुड़ रहे हैं...',
    copied: 'कॉपी हो गया!',
  },
};


  const t = texts[language as keyof typeof texts] || texts.en;

  const generateGroupCode = () => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setGeneratedCode(code);
  };

  const handleCreateGroup = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    generateGroupCode();
    setIsLoading(false);
  };

  const handleJoinGroup = async () => {
    if (groupCode.length < 6) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    joinGroup(groupCode);
    onGroupCreated(groupCode);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueWithCode = () => {
    createGroup(generatedCode);
    onGroupCreated(generatedCode);
    console.info("group created")
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-light via-background to-sky-blue-light flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl-mobile font-bold text-foreground">
              {t.title}
            </h1>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm">
              <button
                onClick={() => setMode('create')}
                className="w-full p-6 text-left rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {t.createGroup}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.createDesc}
                    </p>
                  </div>
                </div>
              </button>
            </Card>

            <Card className="p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm">
              <button
                onClick={() => setMode('join')}
                className="w-full p-6 text-left rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <UserPlus className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {t.joinGroup}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.joinDesc}
                    </p>
                  </div>
                </div>
              </button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-light via-background to-sky-blue-light flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl-mobile font-bold text-foreground">
              {t.createGroup}
            </h1>
            <p className="text-muted-foreground">
              {t.createDesc}
            </p>
          </div>

          <Card className="p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm">
            {!generatedCode ? (
              <Button
                onClick={handleCreateGroup}
                disabled={isLoading}
                className="w-full h-button bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Generating...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t.generateCode}
                  </span>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-accent/50 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Group Code</p>
                    <p className="text-3xl font-bold text-primary tracking-widest">
                      {generatedCode}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <span className="flex items-center gap-2 text-success">
                      <Check className="h-4 w-4" />
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      {t.copyCode}
                    </span>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  {t.shareCode}
                </p>
                
                <Button
                  onClick={handleContinueWithCode}
                  className="w-full h-button bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {t.continue}
                </Button>
              </div>
            )}
          </Card>

          <Button
            variant="outline"
            onClick={() => setMode('select')}
            className="w-full"
          >
            {t.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-light via-background to-sky-blue-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl-mobile font-bold text-foreground">
            {t.joinGroup}
          </h1>
          <p className="text-muted-foreground">
            {t.joinDesc}
          </p>
        </div>

        <Card className="p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t.enterCode}
              </label>
              <Input
                type="text"
                placeholder={t.codePlaceholder}
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                className="text-center text-xl tracking-widest h-12"
                maxLength={6}
              />
            </div>
            
            <Button
              onClick={handleJoinGroup}
              disabled={groupCode.length < 6 || isLoading}
              className="w-full h-button bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Joining...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t.continue}
                </span>
              )}
            </Button>
          </div>
        </Card>

        <Button
          variant="outline"
          onClick={() => setMode('select')}
          className="w-full"
        >
          {t.back}
        </Button>
      </div>
    </div>
  );
};