import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuspenseFallback } from '@/components/SuspenseFallback';
const Onboarding = React.lazy(() => import('@/components/onboarding').then(m => ({ default: m.Onboarding })));
const Login = React.lazy(() => import('@/components/login').then(m => ({ default: m.Login })));
const GroupSetup = React.lazy(() => import('@/components/group-setup').then(m => ({ default: m.GroupSetup })));

type AppStep = 'onboarding' | 'login' | 'group-setup' | 'dashboard';

const Index = () => {
  const navigate = useNavigate();

  // Initialize based on localStorage lazily to avoid extra reads on re-renders
  const [currentStep, setCurrentStep] = useState<AppStep>(() =>
    localStorage.getItem('groupEnabled') === 'true' ? 'dashboard' : 'onboarding'
  );
  const [language, setLanguage] = useState('en');

  const handleLanguageComplete = useCallback((selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setCurrentStep('login');
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setCurrentStep('group-setup');
  }, []);

  const handleGroupCreated = useCallback((_code: string) => {
    localStorage.setItem('groupEnabled', 'true');
    setCurrentStep('dashboard');
  }, []);

  // ✅ jabhi dashboard step set ho, navigate to /dashboard
  useEffect(() => {
    if (currentStep === 'dashboard') {
      navigate('/dashboard');
    }
  }, [currentStep, navigate]);

  switch (currentStep) {
    case 'onboarding':
      return (
        <ErrorBoundary>
          <Suspense fallback={<SuspenseFallback />}>
            <Onboarding onComplete={handleLanguageComplete} />
          </Suspense>
        </ErrorBoundary>
      );

    case 'login':
      return (
        <ErrorBoundary>
          <Suspense fallback={<SuspenseFallback />}>
            <Login onLoginSuccess={handleLoginSuccess} />
          </Suspense>
        </ErrorBoundary>
      );

    case 'group-setup':
      return (
        <ErrorBoundary>
          <Suspense fallback={<SuspenseFallback />}>
            <GroupSetup onGroupCreated={handleGroupCreated} language={language} />
          </Suspense>
        </ErrorBoundary>
      );

    // 👇 ye return karne ki zarurat nahi, navigate handle karega
    case 'dashboard':
      return null;

    default:
      return null;
  }
};

export default Index;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-destructive">Something went wrong.</div>;
    }
    return this.props.children as React.ReactElement;
  }
}
