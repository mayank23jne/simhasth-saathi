import React, { useState, memo } from 'react';
import { AlertTriangle, Phone, Shield, Clock, Sparkles } from 'lucide-react';
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/context/TranslationContext';
import { useAppStore } from '@/store/appStore';
import HelpdeskScreen from './HelpdeskScreen';
import { motion } from 'framer-motion';

const SOSScreen = () => {
  const { t } = useTranslation();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const triggerSOS = useAppStore(s => s.triggerSOS);
  const sosAlerts = useAppStore(s => s.sosAlerts);
  const updateSOS = useAppStore(s => s.updateSOS);
  const groupCode = useAppStore(s => s.groupCode);
  const userLocation = useAppStore(s => s.userLocation);
  const members = useAppStore(s => s.members);
  const setUserLocation = useAppStore(s => s.setUserLocation);

  const [volunteerOpen, setVolunteerOpen] = useState(false);
  const [policeOpen, setPoliceOpen] = useState(false);
  const [actionFlash, setActionFlash] = useState<Record<string, 'responded' | 'resolved' | 'viewed' | undefined>>({});
  const addMarker = useAppStore(s => s.addMarker);
  const [alertMeta, setAlertMeta] = useState<Record<string, { lat: number; lng: number; area?: string }>>({});
  const [confirmCountdown, setConfirmCountdown] = useState<number | null>(null);
  const countdownIntervalRef = React.useRef<number | null>(null);
  const sendTimeoutRef = React.useRef<number | null>(null);
  const INITIAL_COUNTDOWN = 5;
  const [rippleTs, setRippleTs] = useState<number | null>(null);
  const [burstTs, setBurstTs] = useState<number | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number } | null>(null);

  // Robust last-known location resolver for self; prefers live userLocation, then member.position, then last path point, then mapCenter, then default
  const getSelfLastLocation = (): { lat: number; lng: number } | null => {
    const selfMember = members.find(m => m.isSelf);
    const fromUser = userLocation || null;
    const fromPosition = selfMember?.position || null;
    const fromPath = Array.isArray(selfMember?.path) && selfMember!.path.length > 0
      ? { lat: selfMember!.path[selfMember!.path.length - 1].lat, lng: selfMember!.path[selfMember!.path.length - 1].lng }
      : null;
    let fromMapCenter: { lat: number; lng: number } | null = null;
    try {
      const raw = localStorage.getItem('mapCenter');
      if (raw) {
        const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          fromMapCenter = { lat: parsed.lat, lng: parsed.lng };
        }
      }
    } catch {}
    const DEFAULT_FALLBACK = { lat: 23.1765, lng: 75.7884 };
    const lat = fromUser?.lat ?? fromPosition?.lat ?? fromPath?.lat ?? fromMapCenter?.lat ?? DEFAULT_FALLBACK.lat;
    const lng = fromUser?.lng ?? fromPosition?.lng ?? fromPath?.lng ?? fromMapCenter?.lng ?? DEFAULT_FALLBACK.lng;
    return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null;
  };

  // Start a lightweight geolocation watcher here as well so store gets real-time updates even if Map screen isn't mounted
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    let lastUpdateTs = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateTs < 2500) return; // simple throttle to avoid spam
        lastUpdateTs = now;
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (countdownIntervalRef.current != null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (sendTimeoutRef.current != null) {
        window.clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    };
  }, []);

  const doSendSOS = () => {
    setIsEmergency(true);
    setShowConfirmation(true);
    navigator.vibrate?.([200, 100, 200, 100, 400]);
    const newAlert = triggerSOS();
    const selfLoc = getSelfLastLocation();
    if (selfLoc) {
      setAlertMeta((prev) => ({ ...prev, [newAlert.id]: { lat: selfLoc.lat, lng: selfLoc.lng } }));
    }
    sendTimeoutRef.current = window.setTimeout(() => {
      updateSOS(newAlert.id, { status: 'responded', responder: 'Volunteer Team' });
      setIsEmergency(false);
    }, 3000);
  };

  const handleCancelSOS = () => {
    if (countdownIntervalRef.current != null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setConfirmCountdown(null);
    setShowConfirmation(false);
    setIsEmergency(false);
    navigator.vibrate?.(0);
  };

  const handleSendNow = () => {
    if (countdownIntervalRef.current != null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setConfirmCountdown(null);
    doSendSOS();
  };

  const handleSOSPress = () => {
    if (isEmergency || confirmCountdown !== null) return;
    setShowConfirmation(true);
    setConfirmCountdown(INITIAL_COUNTDOWN);
    navigator.vibrate?.([100, 50, 100]);
    countdownIntervalRef.current = window.setInterval(() => {
      setConfirmCountdown((prev) => {
        if (prev == null) return null;
        const next = prev - 1;
        if (next > 0) {
          navigator.vibrate?.(50);
          return next;
        }
        if (countdownIntervalRef.current != null) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setConfirmCountdown(null);
        doSendSOS();
        return null;
      });
    }, 1000);
  };

  const handleSOSClick = () => {
    setRippleTs(Date.now());
    setBurstTs(Date.now());
    handleSOSPress();
  };

  const handleOpenVolunteer = () => setVolunteerOpen(true);
  const handleCloseVolunteer = () => setVolunteerOpen(false);
  const handleOpenPolice = () => setPoliceOpen(true);
  const handleClosePolice = () => setPoliceOpen(false);

  const handleSmsClick = () => {
    const selfLoc = getSelfLastLocation();
    if (!selfLoc) return;
    const { lat, lng } = selfLoc;
    addMarker({ id: undefined as any, label: 'Last Known Location', position: { lat, lng } });
    try {
      localStorage.setItem('mapCenter', JSON.stringify({ lat, lng, ts: Date.now(), source: 'sms' }));
    } catch {}
    setPoliceOpen(true);
  };

  const handleRespond = (id: string) => {
    updateSOS(id, { status: 'responded', responder: 'Volunteer Team' });
    setActionFlash((prev) => ({ ...prev, [id]: 'responded' }));
    window.setTimeout(() => setActionFlash((prev) => ({ ...prev, [id]: undefined })), 1200);
  };

  const handleResolve = (id: string) => {
    updateSOS(id, { status: 'resolved' });
    setActionFlash((prev) => ({ ...prev, [id]: 'resolved' }));
    window.setTimeout(() => setActionFlash((prev) => ({ ...prev, [id]: undefined })), 1200);
  };

  const handlePoliceAcknowledge = (id: string) => {
    updateSOS(id, { status: 'responded', responder: 'Police Team' });
    setActionFlash((prev) => ({ ...prev, [id]: 'responded' }));
    window.setTimeout(() => setActionFlash((prev) => ({ ...prev, [id]: undefined })), 1200);
  };

  const handlePoliceResolve = (id: string) => {
    updateSOS(id, { status: 'resolved' });
    setActionFlash((prev) => ({ ...prev, [id]: 'resolved' }));
    window.setTimeout(() => setActionFlash((prev) => ({ ...prev, [id]: undefined })), 1200);
  };

  const handleViewOnMap = (lat?: number, lng?: number, label: string = 'SOS Alert') => {
    const centerLat = typeof lat === 'number' ? lat : userLocation?.lat;
    const centerLng = typeof lng === 'number' ? lng : userLocation?.lng;
    if (typeof centerLat !== 'number' || typeof centerLng !== 'number') return;
    addMarker({ id: undefined as any, label, position: { lat: centerLat, lng: centerLng } });
    try {
      localStorage.setItem('mapCenter', JSON.stringify({ lat: centerLat, lng: centerLng, ts: Date.now(), source: 'sos' }));
    } catch {}
  };

  // Keep alertMeta up-to-date automatically when alerts exist and userLocation/members update.
  // Ensures each alert always has the best available last-known location, and it updates in real-time.
  React.useEffect(() => {
    if (!sosAlerts || sosAlerts.length === 0) return;
    const selfLoc = getSelfLastLocation();
    if (!selfLoc) return;
    setAlertMeta((prev) => {
      const next = { ...prev };
      for (const alert of sosAlerts) {
        const existing = next[alert.id];
        // If missing or changed coords, set/update to latest
        if (!existing || existing.lat !== selfLoc.lat || existing.lng !== selfLoc.lng) {
          next[alert.id] = { lat: selfLoc.lat, lng: selfLoc.lng, area: existing?.area };
        }
      }
      return next;
    });
  }, [sosAlerts, userLocation, members]);

  // Reverse geocode to area name for alerts that have lat/lng but missing area
  React.useEffect(() => {
    const idsToFetch = Object.entries(alertMeta)
      .filter(([, meta]) => meta && meta.lat != null && meta.lng != null && !meta.area)
      .map(([id]) => id);
    if (idsToFetch.length === 0) return;

    idsToFetch.forEach(async (id) => {
      const meta = alertMeta[id];
      if (!meta) return;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${meta.lat}&lon=${meta.lng}&zoom=14`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('reverse geocode failed');
        const data: any = await res.json();
        const name = data?.name || data?.display_name || '';
        const area = name || [data?.address?.suburb, data?.address?.city, data?.address?.state]
          .filter(Boolean)
          .join(', ');
        if (area) {
          setAlertMeta((prev) => ({ ...prev, [id]: { ...prev[id], area } }));
        }
      } catch {
        // ignore failures, keep fallback
      }
    });
  }, [alertMeta]);

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {confirmCountdown !== null && (() => {
        const ringSize = 180;
        const ringStroke = 10;
        const ringRadius = (ringSize - ringStroke) / 2;
        const ringCircumference = 2 * Math.PI * ringRadius;
        const progress = (INITIAL_COUNTDOWN - confirmCountdown) / INITIAL_COUNTDOWN;
        const ringOffset = ringCircumference * (1 - progress);
        return (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md sm:max-w-lg mx-responsive p-responsive rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-strong animate-scale-in">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <svg width={ringSize} height={ringSize} className="block">
                    <circle
                      stroke="hsl(var(--border))"
                      fill="transparent"
                      strokeWidth={ringStroke}
                      r={ringRadius}
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                    />
                    <circle
                      stroke="hsl(var(--destructive))"
                      fill="transparent"
                      strokeWidth={ringStroke}
                      strokeLinecap="round"
                      r={ringRadius}
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div key={confirmCountdown} className="countdown-digit">
                      {confirmCountdown}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {(t('sosSending') || 'Sending SOS')} in {confirmCountdown}s...
                </div>
                <div className="mt-lg grid grid-cols-2 gap-sm w-full">
                  <ResponsiveButton variant="outline" onClick={handleCancelSOS} className="flex-1">
                    {t('cancel') || 'Cancel'}
                  </ResponsiveButton>
                  <ResponsiveButton 
                    onClick={handleSendNow} 
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
                  >
                    {t('sendNow') || 'Send now'}
                  </ResponsiveButton>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="px-responsive py-responsive space-y-responsive">
        {/* SOS Button - Enhanced for all devices */}
        <div className="relative flex-1 flex items-center justify-center py-responsive min-h-[40vh] sm:min-h-[50vh]">
            {/* Ambient interactive backdrop */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-8 -left-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-sky-blue/20 blur-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            />
            <ResponsiveContainer size="full" padding="responsive">
              <div className="text-center animate-fade-in">
                <motion.div
                  className="relative inline-block will-change-transform"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const rx = ((y / rect.height) - 0.5) * 12;
                    const ry = ((x / rect.width) - 0.5) * -12;
                    setTilt({ rx, ry });
                  }}
                  onMouseLeave={() => setTilt(null)}
                  style={{ transform: tilt ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` : undefined }}
                >
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="sos-halo" />
                    <span className="sos-halo-2" />
                  </div>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute h-24 w-24 rounded-full bg-primary/20 blur-2xl"
                    style={{
                      left: tilt ? `${50 + (tilt.ry * 1.5)}%` : '50%',
                      top: tilt ? `${50 - (tilt.rx * 1.5)}%` : '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  {/* Click ripple */}
                  {rippleTs && (
                    <motion.span
                      key={rippleTs}
                      className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive/40"
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ opacity: 0, scale: 1.3 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      onAnimationComplete={() => setRippleTs(null)}
                    />
                  )}
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-[2]"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  >
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shadow-glow" />
                  </motion.span>
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-[2]"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  >
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-sky-blue/60 shadow-glow" />
                  </motion.span>
                <ResponsiveButton
                  size="lg"
                    className={`relative z-[1] w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full text-responsive-lg font-bold shadow-strong shadow-glow ${
                    isEmergency 
                      ? 'bg-destructive hover:bg-destructive animate-pulse scale-110' 
                      : 'bg-destructive hover:bg-destructive/90 hover:scale-110'
                  }`}
                  onClick={handleSOSClick}
                    disabled={isEmergency || confirmCountdown !== null}
                    touchOptimized
                    animated
                    aria-label="Emergency SOS Button"
                >
                  <div className="flex flex-col items-center gap-xs sm:gap-sm">
                    <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                    <span className="text-sm sm:text-base lg:text-lg">{t('sosButton')}</span>
                    <span className="text-xs sm:text-sm font-normal hidden sm:block">{t('sosEmergency')}</span>
                  </div>
                </ResponsiveButton>
                {burstTs && (
                  <>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i / 12) * Math.PI * 2;
                      const distance = 28 + (i % 3) * 8;
                      const dx = Math.cos(angle) * distance;
                      const dy = Math.sin(angle) * distance;
                      return (
                        <motion.span
                          key={`${burstTs}-${i}`}
                          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}
                          initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                          animate={{ x: dx, y: dy, opacity: 0, scale: 1.15 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          onAnimationComplete={() => setBurstTs(null)}
                        />
                      );
                    })}
                  </>
                )}
                {/* subtle tip under button on larger screens */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t('tapToCancel') || 'Auto-sends in 5s. Tap cancel to stop.'}</span>
                </div>
                </motion.div>
                <p className="mt-lg text-responsive-sm text-muted-foreground max-w-xs mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {t('sosSubtitle')}
                </p>
              </div>
            </ResponsiveContainer>
        </div>

        {/* Confirmation Alert - Enhanced responsive */}
        {showConfirmation && (
          <Alert className="border-success bg-success/10 shadow-success animate-slide-up">
            <Shield className="h-4 w-4 text-success flex-shrink-0" />
            <AlertDescription className="text-success text-responsive-sm">
              {confirmCountdown !== null ? (
                <div className="flex items-center justify-between gap-sm">
                  <div className="flex items-center gap-sm">
                    <div className="animate-pulse">⚠️</div>
                    <span>
                      {t('sosSending') || 'Sending SOS'} in {confirmCountdown}s... {t('tapToCancel') || 'Tap cancel to stop'}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <ResponsiveButton size="sm" variant="outline" onClick={handleCancelSOS}>
                      {t('cancel') || 'Cancel'}
                    </ResponsiveButton>
                    <ResponsiveButton size="sm" onClick={handleSendNow}>
                      {t('sendNow') || 'Send now'}
                    </ResponsiveButton>
                  </div>
                </div>
              ) : isEmergency ? (
                <div className="flex items-center gap-sm">
                  <div className="animate-pulse">⚡</div>
                  {t('sosSending')}
                </div>
              ) : (
                t('sosSent')
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Emergency Contacts */}
        <HelpdeskScreen/>
        {/* <div>
          <h3 className="text-base font-semibold mb-md">{t('quickContacts')}</h3>
          <div className="grid grid-cols-2 gap-md">
            <Button
              variant="outline"
              className="h-14 flex-col gap-xs border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-white"
              onClick={handleSmsClick}
              aria-haspopup="dialog"
              aria-expanded={policeOpen}
              aria-controls="police-sos-panel"
            >
              <Phone className="h-5 w-5" />
              <span className="text-sm">{t('police')}</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex-col gap-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleOpenVolunteer}
              aria-haspopup="dialog"
              aria-expanded={volunteerOpen}
              aria-controls="volunteer-sos-panel"
            >
              <Shield className="h-5 w-5" />
              <span className="text-sm">{t('volunteers')}</span>
            </Button>
          </div>
        </div> */}

        {/* Recent Alerts - Enhanced responsive design */}
        {sosAlerts.length > 0 && (
          <ResponsiveCard 
            className="shadow-soft" 
            hover 
            animated 
            delay={0.3}
          >
            <CardHeader className="pb-md">
              <CardTitle className="text-responsive-base flex items-center gap-sm">
                <Clock className="h-4 w-4 flex-shrink-0" />
                {t('recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-sm">
              {sosAlerts.map((alert) => {
                const selfMember = members.find(m => m.isSelf);
                const name = selfMember?.name || 'You';
                const meta = alertMeta[alert.id];
                // Always resolve loc via meta first, then robust self last location, never show em-dash if any location exists
                const fallbackLoc = getSelfLastLocation();
                const loc = meta
                  ? (meta.area ? meta.area : `${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`)
                  : (fallbackLoc ? `${fallbackLoc.lat.toFixed(5)}, ${fallbackLoc.lng.toFixed(5)}` : '—');

                const flash = actionFlash[alert.id];
                return (
                  <div
                    key={alert.id}
                    className={`p-sm rounded-lg border transition-colors ${
                      flash === 'responded' ? 'border-success bg-success/10' :
                      flash === 'resolved' ? 'border-success bg-success/20' :
                      alert.status === 'responded' ? 'border-primary bg-primary/5' :
                      alert.status === 'resolved' ? 'border-success bg-success/5' :
                      'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-sm mb-xs">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className={`text-xs px-xs py-0.5 rounded ${
                        alert.status === 'resolved' ? 'bg-success/20 text-success' :
                        alert.status === 'responded' ? 'bg-primary/20 text-primary' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {alert.status}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-sm">📍 {loc}</div>
                    <div className="flex flex-col sm:flex-row gap-xs">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleViewOnMap(meta?.lat, meta?.lng, `${name} SOS`)}
                      >
                        View on Map
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </ResponsiveCard>
        )}
      </div>
      {/* Volunteer Alerts Modal */}
      {volunteerOpen && (
        <div
          id="volunteer-sos-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Volunteer SOS Alerts"
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseVolunteer} />
          <div className="relative bg-card border border-card-border rounded-t-xl sm:rounded-xl shadow-strong w-full sm:max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-md border-b border-card-border flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground">{t('recentActivity')}</h4>
              <Button variant="ghost" size="sm" onClick={handleCloseVolunteer} aria-label="Close">Close</Button>
            </div>
            <div className="p-md space-y-sm overflow-auto max-h-[70vh]">
              {sosAlerts.length === 0 && (
                <div className="text-sm text-muted-foreground py-md">{t('noData') || 'No recent SOS alerts.'}</div>
              )}
              {sosAlerts.map((alert) => {
                const selfMember = members.find(m => m.isSelf);
                const name = selfMember?.name || 'You';
                const meta = alertMeta[alert.id];
                const fallbackLoc = getSelfLastLocation();
                const loc = meta
                  ? (meta.area ? meta.area : `${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`)
                  : (fallbackLoc ? `${fallbackLoc.lat.toFixed(5)}, ${fallbackLoc.lng.toFixed(5)}` : '—');
                const statusLabel = alert.status === 'resolved' ? t('resolved') : alert.status === 'responded' ? t('responded') : t('sent');
                const flash = actionFlash[alert.id];
                return (
                  <div key={alert.id} className="p-md bg-muted rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-md">
                      <div className="space-y-xs">
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-muted-foreground">{t('groupCode') || 'Group Code'}: {groupCode || '—'}</div>
                        <div className="text-xs text-muted-foreground">{t('lastKnownLocation') || 'Last Known Location'}: {loc}</div>
                        <div className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-sm py-xs rounded-full text-xs font-medium ${
                          alert.status === 'resolved'
                            ? 'bg-success/20 text-success'
                            : alert.status === 'responded'
                            ? 'bg-sky-blue/20 text-sky-blue'
                            : 'bg-warning/20 text-warning'
                        }`}>{statusLabel}</span>
                        {alert.responder && (
                          <div className="text-xs text-muted-foreground mt-xs">{alert.responder}</div>
                        )}
                        {flash && (
                          <div className="text-xs mt-xs animate-pulse">
                            {flash === 'responded' ? (t('responded') || 'Responded') : (t('resolved') || 'Resolved')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-sm flex items-center gap-sm justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRespond(alert.id)}
                        className="hover:scale-[1.02] transition-transform"
                        disabled={alert.status !== 'sent'}
                        aria-disabled={alert.status !== 'sent'}
                      >
                        {t('respond') || 'Respond'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                        className="hover:scale-[1.02] transition-transform"
                        disabled={alert.status === 'resolved'}
                        aria-disabled={alert.status === 'resolved'}
                      >
                        {t('resolve') || 'Resolve'}
                      </Button>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { handleViewOnMap(meta?.lat, meta?.lng, `SOS ${name}`); setActionFlash((prev) => ({ ...prev, [alert.id]: 'viewed' })); window.setTimeout(() => setActionFlash((prev) => ({ ...prev, [alert.id]: undefined })), 1200); }}
                        className="hover:scale-[1.02] transition-transform"
                      >
                        {t('viewOnMap') || 'View on Map'}
                      </Button> */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Police Alerts Modal */}
      {policeOpen && (
        <div
          id="police-sos-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Police SOS Alerts"
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleClosePolice} />
          <div className="relative bg-card border border-card-border rounded-t-xl sm:rounded-xl shadow-strong w-full sm:max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-md border-b border-card-border flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground">{t('recentActivity')}</h4>
              <Button variant="ghost" size="sm" onClick={handleClosePolice} aria-label="Close">Close</Button>
            </div>
            <div className="p-md space-y-sm overflow-auto max-h-[70vh]">
              {sosAlerts.length === 0 && (
                <div className="text-sm text-muted-foreground py-md">{t('noData') || 'No recent SOS alerts.'}</div>
              )}
              {sosAlerts.map((alert) => {
                const selfMember = members.find(m => m.isSelf);
                const name = selfMember?.name || 'You';
                const meta = alertMeta[alert.id];
                const fallbackLoc = getSelfLastLocation();
                const loc = meta
                  ? (meta.area ? meta.area : `${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`)
                  : (fallbackLoc ? `${fallbackLoc.lat.toFixed(5)}, ${fallbackLoc.lng.toFixed(5)}` : '—');
                const statusLabel = alert.status === 'resolved' ? t('resolved') : alert.status === 'responded' ? t('responded') : t('sent');
                const flash = actionFlash[alert.id];
                return (
                  <div key={alert.id} className="p-md bg-muted rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-md">
                      <div className="space-y-xs">
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-muted-foreground">{t('groupCode') || 'Group Code'}: {groupCode || '—'}</div>
                        <div className="text-xs text-muted-foreground">{t('lastKnownLocation') || 'Last Known Location'}: {loc}</div>
                        <div className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-sm py-xs rounded-full text-xs font-medium ${
                          alert.status === 'resolved'
                            ? 'bg-success/20 text-success'
                            : alert.status === 'responded'
                            ? 'bg-sky-blue/20 text-sky-blue'
                            : 'bg-warning/20 text-warning'
                        }`}>{statusLabel}</span>
                        {alert.responder && (
                          <div className="text-xs text-muted-foreground mt-xs">{alert.responder}</div>
                        )}
                        {flash && (
                          <div className="text-xs mt-xs animate-pulse">
                            {flash === 'responded' ? (t('responded') || 'Responded') : (t('resolved') || 'Resolved')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-sm flex items-center gap-sm justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePoliceAcknowledge(alert.id)}
                        className="hover:scale-[1.02] transition-transform"
                        disabled={alert.status !== 'sent'}
                        aria-disabled={alert.status !== 'sent'}
                      >
                        {t('acknowledge') || 'Acknowledge'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePoliceResolve(alert.id)}
                        className="hover:scale-[1.02] transition-transform"
                        disabled={alert.status === 'resolved'}
                        aria-disabled={alert.status === 'resolved'}
                      >
                        {t('resolve') || 'Resolve'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SOSScreen);
