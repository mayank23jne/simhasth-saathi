import React, { useState, memo } from 'react';
import { AlertTriangle, Phone, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/context/TranslationContext';
import { useAppStore } from '@/store/appStore';

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

  const handleSOSPress = () => {
    if (isEmergency) return;

    setIsEmergency(true);
    setShowConfirmation(true);

    const newAlert = triggerSOS();
    const selfLoc = getSelfLastLocation();
    if (selfLoc) {
      setAlertMeta((prev) => ({ ...prev, [newAlert.id]: { lat: selfLoc.lat, lng: selfLoc.lng } }));
    }

    window.setTimeout(() => {
      updateSOS(newAlert.id, { status: 'responded', responder: 'Volunteer Team' });
      setIsEmergency(false);
    }, 3000);
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
    <div className="flex flex-col bg-background">
      <div className="px-lg py-xl space-y-lg">
        {/* SOS Button */}
        <div className="flex-1 flex items-center justify-center py-2xl">
          <div className="text-center">
            <Button
              size="lg"
              className={`w-40 h-40 rounded-full text-xl font-bold shadow-strong transition-all duration-300 ${
                isEmergency 
                  ? 'bg-destructive hover:bg-destructive animate-pulse scale-110' 
                  : 'bg-destructive hover:bg-destructive/90 hover:scale-105'
              }`}
              onClick={handleSOSPress}
              disabled={isEmergency}
            >
              <div className="flex flex-col items-center gap-sm">
                <AlertTriangle className="h-12 w-12" />
                <span className="text-base">{t('sosButton')}</span>
                <span className="text-sm font-normal">{t('sosEmergency')}</span>
              </div>
            </Button>
            <p className="mt-lg text-sm text-muted-foreground max-w-xs mx-auto">
              {t('sosSubtitle')}
            </p>
          </div>
        </div>

        {/* Confirmation Alert */}
        {showConfirmation && (
          <Alert className="border-success bg-success/10">
            <Shield className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              {isEmergency ? (
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
        <div>
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
        </div>

        {/* Recent Alerts */}
        {sosAlerts.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader className="pb-md">
              <CardTitle className="text-base flex items-center gap-sm">
                <Clock className="h-4 w-4" />
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
                const statusLabel = alert.status === 'resolved' ? t('resolved') : alert.status === 'responded' ? t('responded') : t('sent');
                return (
                  <div key={alert.id} className="flex items-center justify-between p-md bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(t('groupCode') || 'Group Code')}: {groupCode || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(t('lastKnownLocation') || 'Last Known Location')}: {loc}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-sm py-xs rounded-full text-xs font-medium ${
                        alert.status === 'resolved' 
                          ? 'bg-success/20 text-success' 
                          : alert.status === 'responded'
                          ? 'bg-sky-blue/20 text-sky-blue'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {statusLabel}
                      </span>
                      {alert.responder && (
                        <p className="text-xs text-muted-foreground mt-xs">{alert.responder}</p>
                      )}
                      <div className="mt-xs flex items-center justify-end">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnMap(meta?.lat, meta?.lng, `SOS ${name}`)}
                          className="hover:scale-[1.02] transition-transform"
                        >
                          {t('viewOnMap') || 'View on Map'}
                        </Button> */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
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
