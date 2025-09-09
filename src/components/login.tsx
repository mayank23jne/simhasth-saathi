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
    <div className="min-h-screen-safe bg-gradient-to-br from-sky-blue-light via-background to-saffron-light flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl transition-transform duration-300 hover:scale-105">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-responsive-xl font-bold text-foreground font-heading">
            {step === 'phone' ? t('loginTitle') : t('otpTitle')}
          </h1>
          <p className="text-muted-foreground text-responsive-sm max-w-sm mx-auto">
            {step === 'phone' ? t('loginSubtitle') : otpSubtitle}
          </p>
        </div>

        {/* Form */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-elegant">
          <div className="space-y-4 sm:space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <label className="text-responsive-xs font-medium text-foreground block">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder={t('phonePlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 min-h-input text-responsive-sm focus-ring transition-all duration-200"
                    maxLength={13}
                    aria-label="Enter your phone number"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={phoneNumber.length < 10 || isLoading}
                  className="w-full min-h-button bg-primary hover:bg-primary/90 text-primary-foreground focus-ring touch-button transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send OTP to your phone"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        {t('sendOtp')}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="text-responsive-xs font-medium text-foreground block">
                  {t('otpLabel')}
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl sm:text-2xl tracking-widest min-h-input focus-ring transition-all duration-200"
                  maxLength={6}
                  aria-label="Enter 6-digit OTP"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || isLoading}
                  className="w-full min-h-button bg-primary hover:bg-primary/90 text-primary-foreground focus-ring touch-button transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Verify OTP and login"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        {t('verifying')}
                      </>
                    ) : (
                      <>
                        {t('verifyOtp')}
                        <UserCheck className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('phone')}
                  className="w-full min-h-button focus-ring touch-button transition-all duration-200"
                  disabled={isLoading}
                  aria-label="Go back to phone number entry"
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
          className="w-full min-h-button border-primary/20 hover:bg-primary/5 text-primary focus-ring touch-button transition-all duration-200"
          aria-label="Continue as guest user"
        >
          <span className="text-responsive-sm font-medium">{t('guestMode')}</span>
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 text-center px-2">
          <Shield className="h-3 w-3 flex-shrink-0" />
          <span className="leading-relaxed">{t('securityNotice')}</span>
        </p>
      </div>
    </div>
  );
};
