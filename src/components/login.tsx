import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Phone, Shield, UserCheck } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation(); // ✅ use context for real-time translation
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpSubtitle = t('otpSubtitle')?.replace('{phoneNumber}', phoneNumber) || '';

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep('otp');
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onLoginSuccess();
  };

  const handleGuestMode = () => {
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-blue-light via-background to-saffron-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl-mobile font-bold text-foreground">
            {step === 'phone' ? t('loginTitle') : t('otpTitle')}
          </h1>
          <p className="text-muted-foreground">
            {step === 'phone' ? t('loginSubtitle') : otpSubtitle}
          </p>
        </div>

        {/* Form */}
        <Card className="p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm">
          <div className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">{t('phoneLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder={t('phonePlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12 text-base"
                    maxLength={13}
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={phoneNumber.length < 10 || isLoading}
                  className="w-full h-button bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? t('sending') : t('sendOtp')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">{t('otpLabel')}</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest h-12"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || isLoading}
                  className="w-full h-button bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? t('verifying') : t('verifyOtp')}
                  <UserCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('phone')}
                  className="w-full"
                  disabled={isLoading}
                >
                  {t('resendOtp')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Guest Mode */}
        <Button
          variant="outline"
          onClick={handleGuestMode}
          className="w-full h-12 border-primary/20 hover:bg-primary/5"
        >
          {t('guestMode')}
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" />
          {t('securityNotice')}
        </p>
      </div>
    </div>
  );
};
