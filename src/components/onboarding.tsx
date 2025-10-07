import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageSelector } from '@/components/ui/language-selector';
import { ArrowRight, Shield } from 'lucide-react';
import simhasthLogo from '@/assets/simhastha_logo.png';
import hackathonBadge from '@/assets/Hackathon.png';
import { LanguageCode, useTranslation } from '@/context/TranslationContext';

interface OnboardingProps {
  onComplete: (language: LanguageCode) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { language, setLanguage, t, tArray } = useTranslation();
  const navigate = useNavigate();

  const handleNext = () => {
    onComplete(language); // context language is already updated
  };

  const handleAdminLogin = () => {
    try {
      localStorage.setItem('adminAuth', JSON.stringify({ isAuthenticated: true, role: 'admin', ts: Date.now() }));
    } catch {}
    navigate('/admin/dashboard');
  };

  const downloadQrPng = async () => {
    try {
      const response = await fetch('https://app.jyada.in/api/qr/generate-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: 12 })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
  
      // Create a download link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
  
      // Clean up URL object after download
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
    

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-saffron-light via-background to-sky-blue-light flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="relative flex justify-center">
            <div className="relative group">
              <img 
                src={simhasthLogo} 
                alt="Simhasth Saathi Logo" 
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl shadow-medium transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1.5 sm:p-2 shadow-soft transition-transform duration-300 group-hover:scale-110">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="absolute -top-3 -left-3 bg-card/90 rounded-md p-1 shadow-soft backdrop-blur-sm left-[36px] top-[-40px] sm:left-[40px] sm:top-[-45px]">
                <img
                  src={hackathonBadge}
                  alt="Hackathon Badge"
                  className="h-[40px] w-[80px] sm:h-[50px] sm:w-[100px] object-contain"
                  loading="eager"
                />
              </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-responsive-2xl font-bold text-foreground text-saffron-dark font-heading">
              {t('welcomeTitle')}
            </h1>
            <p className="text-muted-foreground text-responsive-base leading-relaxed max-w-sm mx-auto">
              {t('welcomeSubtitle')}
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-elegant">
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <h3 className="text-responsive-lg font-semibold text-foreground mb-2 font-heading">
                {t('chooseLanguage')}
              </h3>
            </div>
            
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full min-h-button bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium focus-ring touch-button transition-all duration-200"
            aria-label="Continue to next step"
          >
            <span className="flex items-center justify-center gap-3 text-responsive-sm font-medium">
              {t('next')}
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Button>

          <Button
            onClick={handleAdminLogin}
            variant="outline"
            size="lg"
            className="w-full min-h-button border-primary/20 hover:bg-primary/5 text-primary shadow-soft focus-ring touch-button transition-all duration-200"
            aria-label={t('adminLogin')}
          >
            <span className="flex items-center justify-center gap-3 text-responsive-sm font-medium">
              {t('adminLogin')}
            </span>
          </Button>

          <Button
            onClick={downloadQrPng}
            variant="outline"
            size="lg"
            className="w-full min-h-button border-primary/20 hover:bg-primary/5 text-primary shadow-soft focus-ring touch-button transition-all duration-200"
            aria-label="Generate Pre QR">
            <span className="flex items-center justify-center gap-3 text-responsive-sm font-medium">
              Generate pre QR
            </span>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
          {tArray('features').map((feature, index) => (
            <div 
              key={index} 
              className="text-center p-2 rounded-lg hover:bg-white/50 transition-all duration-200 group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="text-xl sm:text-2xl mb-1 transition-transform duration-200 group-hover:scale-110">
                {['🗺️', '🚨', '🛡️'][index]}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
