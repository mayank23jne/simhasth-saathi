import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface GroupMember {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  lastUpdated: number; // epoch ms
  isSelf?: boolean;
  headingDeg?: number; // 0..360, where 0 is north
  path?: { lat: number; lng: number; ts: number }[]; // recent positions for trail
}

interface GroupContextValue {
  groupCode: string | null;
  userId: string | null;
  userLocation: { lat: number; lng: number } | null;
  members: GroupMember[];
  mapMode: 'groups' | 'helpdesk';
  helpdeskTarget: { id: string; name: string; lat: number; lng: number } | null;
  joinGroup: (groupCode: string) => void;
  createGroup: (groupCode: string) => void;
  leaveGroup: () => void;
  setUserLocation: (lat: number, lng: number) => void;
  setMapMode: (mode: 'groups' | 'helpdesk', target?: { id: string; name: string; lat: number; lng: number } | null) => void;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  groupCode: 'groupCode',
  userId: 'userId',
  groupEnabled: 'groupEnabled',
};

const MOCK_NAMES = ['Ravi', 'Sita', 'Mohan', 'Radha', 'Arjun', 'Neha', 'Kiran'];

function generateId(prefix: string = 'usr'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function pickRandomNames(count: number): string[] {
  const shuffled = [...MOCK_NAMES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const GroupProvider = ({ children }: { children: React.ReactNode }) => {
  const [groupCode, setGroupCode] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.groupCode));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.userId));
  const [userLocation, setUserLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [mapMode, setMapModeState] = useState<'groups' | 'helpdesk'>('groups');
  const [helpdeskTarget, setHelpdeskTarget] = useState<{ id: string; name: string; lat: number; lng: number } | null>(null);

  const updateIntervalRef = useRef<number | null>(null);

  const initializeMockMembers = useCallback((anchor: { lat: number; lng: number } | null) => {
    // 3–4 mock members around the user's current or default anchor
    const count = 3 + Math.floor(Math.random() * 2);
    const base = anchor || { lat: 23.1765, lng: 75.7884 };
    const names = pickRandomNames(count);
    const mockMembers: GroupMember[] = names.map((name) => {
      const jitterLat = base.lat + (Math.random() - 0.5) * 0.004;
      const jitterLng = base.lng + (Math.random() - 0.5) * 0.004;
      return {
        id: generateId('mem'),
        name,
        position: { lat: jitterLat, lng: jitterLng },
        lastUpdated: Date.now(),
        isSelf: false,
        path: [{ lat: jitterLat, lng: jitterLng, ts: Date.now() }],
      };
    });

    setMembers((prev) => {
      // Preserve any existing self marker if present
      const self = prev.find((m) => m.isSelf);
      return self ? [self, ...mockMembers] : mockMembers;
    });
  }, []);

  const scheduleSimUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      window.clearTimeout(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    const tick = () => {
      setMembers((prev) => {
        const base = userLocation || (prev.find((m) => m.isSelf)?.position ?? { lat: 23.1765, lng: 75.7884 });
        return prev.map((m) => {
          if (m.isSelf) return m;
          // Slower drift per tick
          const deltaLat = (Math.random() - 0.5) * 0.00015;
          const deltaLng = (Math.random() - 0.5) * 0.00015;
          const towardUserLat = (base.lat - m.position.lat) * 0.006;
          const towardUserLng = (base.lng - m.position.lng) * 0.006;
          const nextLat = m.position.lat + deltaLat + towardUserLat;
          const nextLng = m.position.lng + deltaLng + towardUserLng;
          // Compute heading from previous -> next
          const headingRad = Math.atan2(nextLng - m.position.lng, nextLat - m.position.lat); // y,x swapped because lat ~ north
          const headingDeg = (headingRad * 180) / Math.PI;
          const normalized = (headingDeg + 360) % 360;
          return {
            ...m,
            position: { lat: nextLat, lng: nextLng },
            lastUpdated: Date.now(),
            headingDeg: normalized,
            path: (() => {
              const prevPath = m.path || [{ lat: m.position.lat, lng: m.position.lng, ts: m.lastUpdated }];
              const next = [...prevPath, { lat: nextLat, lng: nextLng, ts: Date.now() }];
              // cap to last 50 points
              return next.slice(Math.max(0, next.length - 50));
            })(),
          };
        });
      });

      // Shorter interval with smaller steps = smoother, slower movement
      const nextDelay = 3000 + Math.random() * 3000; // 3–6s
      updateIntervalRef.current = window.setTimeout(tick, nextDelay);
    };

    // Start first tick soon
    updateIntervalRef.current = window.setTimeout(tick, 2000);
  }, [userLocation]);

  const ensureSelfMember = useCallback((pos: { lat: number; lng: number } | null) => {
    setMembers((prev) => {
      const existingSelf = prev.find((m) => m.isSelf);
      if (existingSelf) {
        // compute heading for self based on movement delta
        let nextHeading: number | undefined = existingSelf.headingDeg;
        if (pos) {
          const dLat = pos.lat - existingSelf.position.lat;
          const dLng = pos.lng - existingSelf.position.lng;
          if (Math.abs(dLat) > 1e-9 || Math.abs(dLng) > 1e-9) {
            const rad = Math.atan2(dLng, dLat);
            nextHeading = ((rad * 180) / Math.PI + 360) % 360;
          }
        }
        return prev.map((m) => (m.isSelf ? {
          ...m,
          position: pos || m.position,
          lastUpdated: Date.now(),
          headingDeg: nextHeading,
          path: (() => {
            const basePath = m.path || [{ lat: m.position.lat, lng: m.position.lng, ts: m.lastUpdated }];
            const nextPos = pos || m.position;
            const next = [...basePath, { lat: nextPos.lat, lng: nextPos.lng, ts: Date.now() }];
            return next.slice(Math.max(0, next.length - 50));
          })(),
        } : m));
      }
      const self: GroupMember = {
        id: userId || generateId('usr'),
        name: 'You',
        position: pos || { lat: 23.1765, lng: 75.7884 },
        lastUpdated: Date.now(),
        isSelf: true,
        headingDeg: undefined,
        path: pos ? [{ lat: pos.lat, lng: pos.lng, ts: Date.now() }] : [{ lat: 23.1765, lng: 75.7884, ts: Date.now() }],
      };
      return [self, ...prev];
    });
  }, [userId]);

  const setUserLocation = useCallback((lat: number, lng: number) => {
    setUserLocationState({ lat, lng });
    ensureSelfMember({ lat, lng });
  }, [ensureSelfMember]);

  const setMapMode = useCallback((mode: 'groups' | 'helpdesk', target?: { id: string; name: string; lat: number; lng: number } | null) => {
    setMapModeState(mode);
    if (mode === 'helpdesk') {
      setHelpdeskTarget(target ?? null);
    } else {
      setHelpdeskTarget(null);
    }
  }, []);

  const joinGroup = useCallback((code: string) => {
    const uid = userId || generateId('usr');
    setUserId(uid);
    setGroupCode(code);
    localStorage.setItem(STORAGE_KEYS.userId, uid);
    localStorage.setItem(STORAGE_KEYS.groupCode, code);
    localStorage.setItem(STORAGE_KEYS.groupEnabled, 'true');
    // Reset and initialize members around current user location
    setMembers([]);
    ensureSelfMember(userLocation);
    initializeMockMembers(userLocation);
    scheduleSimUpdates();
  }, [ensureSelfMember, initializeMockMembers, scheduleSimUpdates, userId, userLocation]);

  const createGroup = useCallback((code: string) => {
    joinGroup(code);
  }, [joinGroup]);

  const leaveGroup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.groupCode);
    localStorage.removeItem(STORAGE_KEYS.groupEnabled);
    // Keep userId to simulate returning user; remove if full reset needed
    setGroupCode(null);
    setMembers([]);
    if (updateIntervalRef.current) {
      window.clearTimeout(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // On mount: load persisted group and spin up simulation if applicable
  useEffect(() => {
    const persistedGroup = localStorage.getItem(STORAGE_KEYS.groupCode);
    const persistedUser = localStorage.getItem(STORAGE_KEYS.userId) || null;
    if (persistedUser) setUserId(persistedUser);
    if (persistedGroup) {
      setGroupCode(persistedGroup);
      ensureSelfMember(userLocation);
      initializeMockMembers(userLocation);
      scheduleSimUpdates();
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.groupCode && e.newValue === null) {
        // group cleared elsewhere -> reset context
        setGroupCode(null);
        setMembers([]);
        if (updateIntervalRef.current) {
          window.clearTimeout(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      if (updateIntervalRef.current) {
        window.clearTimeout(updateIntervalRef.current);
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [ensureSelfMember, initializeMockMembers, scheduleSimUpdates, userLocation]);

  const value = useMemo<GroupContextValue>(() => ({
    groupCode,
    userId,
    userLocation,
    members,
    mapMode,
    helpdeskTarget,
    joinGroup,
    createGroup,
    leaveGroup,
    setUserLocation,
    setMapMode,
  }), [groupCode, userId, userLocation, members, mapMode, helpdeskTarget, joinGroup, createGroup, leaveGroup, setUserLocation, setMapMode]);

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}


