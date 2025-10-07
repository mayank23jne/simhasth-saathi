import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppStore } from "@/store/appStore";
import type { GroupMember } from "@/store/appStore";
import { locationService } from "@/services/locationService";
import { tokenStorage } from "@/lib/api";

interface GroupContextValue {
  groupCode: string | null;
  userId: string | null;
  userLocation: { lat: number; lng: number } | null;
  members: GroupMember[];
  mapMode: "groups" | "helpdesk";
  helpdeskTarget: { id: string; name: string; lat: number; lng: number } | null;
  isInitialized: boolean;
  joinGroup: (groupCode: string) => void;
  createGroup: (groupCode: string) => void;
  leaveGroup: () => void;
  setUserLocation: (lat: number, lng: number) => void;
  setMapMode: (
    mode: "groups" | "helpdesk",
    target?: { id: string; name: string; lat: number; lng: number } | null
  ) => void;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  groupCode: "groupCode",
  userId: "userId",
  groupEnabled: "groupEnabled",
  groupJoinedAt: "groupJoinedAt",
};

const MOCK_NAMES = ["Ravi", "Sita", "Mohan", "Radha", "Arjun", "Neha", "Kiran"];

function generateId(prefix: string = "usr"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function pickRandomNames(count: number): string[] {
  const shuffled = [...MOCK_NAMES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const GroupProvider = ({ children }: { children: React.ReactNode }) => {
  // Source of truth from global store
  const groupCode = useAppStore((s) => s.groupCode);
  const userId = useAppStore((s) => s.userId);
  const userLocation = useAppStore((s) => s.userLocation);
  const userRole = useAppStore((s) => s.userRole);
  const members = useAppStore((s) => s.members);
  const setGroupInStore = useAppStore((s) => s.setGroup);
  const setUserIdInStore = useAppStore((s) => s.setUserId);
  const setUserRoleInStore = useAppStore((s) => s.setUserRole);
  const setUserNameInStore = useAppStore((s) => s.setUserName);
  const setUserPhoneInStore = useAppStore((s) => s.setUserPhone);
  const setUserLocationInStore = useAppStore((s) => s.setUserLocation);
  const addMemberInStore = useAppStore((s) => s.addMember);
  const updateMemberInStore = useAppStore((s) => s.updateMember);
  const clearMembersInStore = useAppStore((s) => s.clearMembers);

  // UI-only state
  const [mapMode, setMapModeState] = useState<"groups" | "helpdesk">("groups");
  const [isInitialized, setIsInitialized] = useState(false);
  const [helpdeskTarget, setHelpdeskTarget] = useState<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  const updateIntervalRef = useRef<number | null>(null);
  const lastLocationPushTsRef = useRef<number>(0);
  const adminPollRef = useRef<number | null>(null);

  const initializeMockMembers = useCallback(
    (anchor: { lat: number; lng: number } | null) => {
      const count = 3 + Math.floor(Math.random() * 2);
      const base = anchor || { lat: 23.1765, lng: 75.7884 };
      const names = pickRandomNames(count);
      names.forEach((name) => {
        const jitterLat = base.lat + (Math.random() - 0.5) * 0.004;
        const jitterLng = base.lng + (Math.random() - 0.5) * 0.004;
        addMemberInStore({
          id: generateId("mem"),
          name,
          position: { lat: jitterLat, lng: jitterLng },
          lastUpdated: Date.now(),
          isSelf: false,
          path: [{ lat: jitterLat, lng: jitterLng, ts: Date.now() }],
        });
      });
    },
    [addMemberInStore]
  );

  const scheduleSimUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      window.clearTimeout(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    const tick = () => {
      try {
        const currentMembers = useAppStore.getState().members;
        const base =
          useAppStore.getState().userLocation ||
          (currentMembers.find((m) => m.isSelf)?.position ?? {
            lat: 23.1765,
            lng: 75.7884,
          });
        currentMembers.forEach((m) => {
          if (m.isSelf || !m.position) return;
          const deltaLat = (Math.random() - 0.5) * 0.00015;
          const deltaLng = (Math.random() - 0.5) * 0.00015;
          const towardUserLat = (base.lat - m.position.lat) * 0.006;
          const towardUserLng = (base.lng - m.position.lng) * 0.006;
          const nextLat = m.position.lat + deltaLat + towardUserLat;
          const nextLng = m.position.lng + deltaLng + towardUserLng;
          const headingRad = Math.atan2(
            nextLng - m.position.lng,
            nextLat - m.position.lat
          );
          const headingDeg = (headingRad * 180) / Math.PI;
          const normalized = (headingDeg + 360) % 360;
          const prevPath = m.path || [
            {
              lat: m.position.lat,
              lng: m.position.lng,
              ts: m.lastUpdated || Date.now(),
            },
          ];
          const nextPath = [
            ...prevPath,
            { lat: nextLat, lng: nextLng, ts: Date.now() },
          ];
          updateMemberInStore(m.id, {
            position: { lat: nextLat, lng: nextLng },
            lastUpdated: Date.now(),
            headingDeg: normalized,
            path: nextPath.slice(Math.max(0, nextPath.length - 50)),
          });
        });
      } catch (error) {
        console.warn("Simulation update error:", error);
      }

      // Shorter interval with smaller steps = smoother, slower movement
      const nextDelay = 3000 + Math.random() * 3000; // 3–6s
      updateIntervalRef.current = window.setTimeout(tick, nextDelay);
    };

    // Start first tick soon
    updateIntervalRef.current = window.setTimeout(tick, 2000);
  }, [updateMemberInStore]);

  const ensureSelfMember = useCallback(
    (pos: { lat: number; lng: number } | null) => {
      const current = useAppStore.getState();
      const existingSelf = current.members.find((m) => m.isSelf);
      if (existingSelf) {
        const basePath = existingSelf.path || [
          {
            lat: existingSelf.position?.lat || pos?.lat || 23.1765,
            lng: existingSelf.position?.lng || pos?.lng || 75.7884,
            ts: existingSelf.lastUpdated || Date.now(),
          },
        ];
        const nextPos = pos ||
          existingSelf.position || { lat: 23.1765, lng: 75.7884 };
        const next = [
          ...basePath,
          { lat: nextPos.lat, lng: nextPos.lng, ts: Date.now() },
        ];
        updateMemberInStore(existingSelf.id, {
          position: nextPos,
          lastUpdated: Date.now(),
          path: next.slice(Math.max(0, next.length - 50)),
        });
        return;
      }
      addMemberInStore({
        id: (current.userId ?? generateId("usr")) as string,
        name: "You",
        isSelf: true,
        position: pos || { lat: 23.1765, lng: 75.7884 },
        lastUpdated: Date.now(),
        path: pos
          ? [{ lat: pos.lat, lng: pos.lng, ts: Date.now() }]
          : [{ lat: 23.1765, lng: 75.7884, ts: Date.now() }],
      });
    },
    [addMemberInStore, updateMemberInStore]
  );

  const setUserLocation = useCallback(
    (lat: number, lng: number) => {
      setUserLocationInStore(lat, lng);
    },
    [setUserLocationInStore]
  );

  const setMapMode = useCallback(
    (
      mode: "groups" | "helpdesk",
      target?: { id: string; name: string; lat: number; lng: number } | null
    ) => {
      setMapModeState(mode);
      if (mode === "helpdesk") {
        setHelpdeskTarget(target ?? null);
      } else {
        setHelpdeskTarget(null);
      }
    },
    []
  );

  const joinGroup = useCallback(
    (code: string) => {
      const uid = userId || generateId("usr");
      setUserIdInStore(uid);
      setGroupInStore(code);
      setUserRoleInStore("member");
      localStorage.setItem(STORAGE_KEYS.groupEnabled, "true");
      try {
        const prevCode = localStorage.getItem(STORAGE_KEYS.groupCode);
        const existingTs = localStorage.getItem(STORAGE_KEYS.groupJoinedAt);
        if (!existingTs || prevCode !== code) {
          localStorage.setItem(
            STORAGE_KEYS.groupJoinedAt,
            Date.now().toString()
          );
        }
      } catch (error) {
        console.warn("Storage error:", error);
      }
      // Reset and initialize members around current user location
      clearMembersInStore();
      if (useAppStore.getState().userLocation) {
        const loc = useAppStore.getState().userLocation!;
        setUserLocationInStore(loc.lat, loc.lng);
      } else {
        ensureSelfMember(null);
      }

      // Fetch initial group locations immediately after joining
      setTimeout(() => {
        if (tokenStorage.get()) {
          locationService
            .getGroupLocations({ groupId: code })
            .then((res) => {
              if (res.success && res.data && Array.isArray(res.data)) {
                const currentState = useAppStore.getState();
                res.data.forEach((memberData) => {
                  const memberId = memberData.id.toString();
                  if (memberId === currentState.userId) return; // skip self

                  const pos = {
                    lat: parseFloat(memberData.latitude),
                    lng: parseFloat(memberData.longitude),
                  };
                  addMemberInStore({
                    id: memberId,
                    name: memberData.full_name || "Member",
                    isSelf: false,
                    position: pos,
                    lastUpdated: Date.now(),
                    path: [{ lat: pos.lat, lng: pos.lng, ts: Date.now() }],
                  });
                });
              }
            })
            .catch((e) =>
              console.error("Error fetching initial group locations:", e)
            );
        }
      }, 1000); // 1 second delay to ensure store is ready
    },
    [
      userId,
      setUserIdInStore,
      setGroupInStore,
      setUserRoleInStore,
      clearMembersInStore,
      setUserLocationInStore,
      ensureSelfMember,
      addMemberInStore,
    ]
  );

  const createGroup = useCallback(
    (code: string) => {
      const uid = userId || generateId("usr");
      setUserIdInStore(uid);
      setGroupInStore(code);
      setUserRoleInStore("admin");
      localStorage.setItem(STORAGE_KEYS.groupEnabled, "true");
      try {
        const prevCode = localStorage.getItem(STORAGE_KEYS.groupCode);
        const existingTs = localStorage.getItem(STORAGE_KEYS.groupJoinedAt);
        if (!existingTs || prevCode !== code) {
          localStorage.setItem(
            STORAGE_KEYS.groupJoinedAt,
            Date.now().toString()
          );
        }
      } catch (error) {
        console.warn("Storage error:", error);
      }
      clearMembersInStore();
      if (useAppStore.getState().userLocation) {
        const loc = useAppStore.getState().userLocation!;
        setUserLocationInStore(loc.lat, loc.lng);
      } else {
        ensureSelfMember(null);
      }

      // Fetch initial group locations immediately after creating group
      setTimeout(() => {
        if (tokenStorage.get()) {
          locationService
            .getGroupLocations({ groupId: code })
            .then((res) => {
              if (res.success && res.data && Array.isArray(res.data)) {
                const currentState = useAppStore.getState();
                res.data.forEach((memberData) => {
                  const memberId = memberData.id.toString();
                  if (memberId === currentState.userId) return; // skip self

                  const pos = {
                    lat: parseFloat(memberData.latitude),
                    lng: parseFloat(memberData.longitude),
                  };
                  addMemberInStore({
                    id: memberId,
                    name: memberData.full_name || "Member",
                    isSelf: false,
                    position: pos,
                    lastUpdated: Date.now(),
                    path: [{ lat: pos.lat, lng: pos.lng, ts: Date.now() }],
                  });
                });
              }
            })
            .catch((e) =>
              console.error("Error fetching initial group locations:", e)
            );
        }
      }, 1000); // 1 second delay to ensure store is ready
    },
    [
      userId,
      setUserIdInStore,
      setGroupInStore,
      setUserRoleInStore,
      clearMembersInStore,
      setUserLocationInStore,
      ensureSelfMember,
      addMemberInStore,
    ]
  );

  const leaveGroup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.groupEnabled);
    setGroupInStore(null);
    clearMembersInStore();
    if (updateIntervalRef.current) {
      window.clearTimeout(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [setGroupInStore, clearMembersInStore]);

  // On mount: load persisted group and spin up simulation if applicable
  useEffect(() => {
    const persistedGroup = localStorage.getItem(STORAGE_KEYS.groupCode);
    if (persistedGroup) {
      // Store already persists its own state; just kick off sim if grouped
      ensureSelfMember(useAppStore.getState().userLocation);
      // Mock members and simulation disabled on mount
    }

    // Mark as initialized after a brief delay to ensure all stores are ready
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.groupCode && e.newValue === null) {
        setGroupInStore(null);
        clearMembersInStore();
        if (updateIntervalRef.current) {
          window.clearTimeout(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      if (updateIntervalRef.current) {
        window.clearTimeout(updateIntervalRef.current);
      }
      window.removeEventListener("storage", onStorage);
    };
  }, [
    ensureSelfMember,
    initializeMockMembers,
    scheduleSimUpdates,
    setGroupInStore,
    clearMembersInStore,
  ]);

  // Throttled location push to backend
  useEffect(() => {
    console.info(userLocation, "authToken");
    console.info(localStorage.getItem("authToken"), "tokenStorage.get()");

    if (!userLocation) return;
    if (!localStorage.getItem("authToken")) return;
    const now = Date.now();
    if (now - lastLocationPushTsRef.current < 5000) return; // 5s throttle
    lastLocationPushTsRef.current = now;
    locationService
      .updateLocation({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      })
      .catch(() => {});
  }, [userLocation]);

  // Group locations polling (for both admin and members)
  useEffect(() => {
    if (adminPollRef.current) {
      window.clearInterval(adminPollRef.current);
      adminPollRef.current = null;
    }
    if (!groupCode) return;
    if (!tokenStorage.get()) return;

    const poll = async () => {
      // Skip if not authenticated
      if (!tokenStorage.get()) return;
      try {
        const groupCode = localStorage.getItem("groupCode");
        const res = await locationService.getGroupLocations({
          groupId: groupCode,
        });
        const currentState = useAppStore.getState();

        // Handle the new API response format
        if (res.success && res.data && Array.isArray(res.data)) {
          res.data.forEach((memberData) => {
            const memberId = memberData.id.toString();
            if (memberId === currentState.userId) return; // skip self, already tracked locally

            const pos = {
              lat: parseFloat(memberData.latitude),
              lng: parseFloat(memberData.longitude),
            };
            const existing = currentState.members.find(
              (m) => m.id === memberId
            );

            if (existing) {
              const basePath = existing.path || [];
              const nextPath = [
                ...basePath,
                { lat: pos.lat, lng: pos.lng, ts: Date.now() },
              ];
              updateMemberInStore(existing.id, {
                position: pos,
                lastUpdated: Date.now(),
                path: nextPath.slice(Math.max(0, nextPath.length - 50)),
              });
            } else {
              addMemberInStore({
                id: memberId,
                name: memberData.full_name || "Member",
                isSelf: false,
                position: pos,
                lastUpdated: Date.now(),
                path: [{ lat: pos.lat, lng: pos.lng, ts: Date.now() }],
              });
            }
          });
        }
      } catch (e: any) {
        // Silence unauthorized noise; keep polling silently until auth is available
        if (
          e?.status === 401 ||
          /access token required/i.test(String(e?.message))
        ) {
          return;
        }
        // For other errors, reduce to warn to avoid console spam
        console.warn("Error polling group locations:", e);
      }
    };

    // initial fetch then interval
    poll();
    adminPollRef.current = window.setInterval(poll, 10000); // 10s for more real-time updates

    return () => {
      if (adminPollRef.current) {
        window.clearInterval(adminPollRef.current);
        adminPollRef.current = null;
      }
    };
  }, [groupCode, userRole, addMemberInStore, updateMemberInStore]);

  const value = useMemo<GroupContextValue>(
    () => ({
      groupCode,
      userId,
      userLocation,
      members,
      mapMode,
      helpdeskTarget,
      isInitialized,
      joinGroup,
      createGroup,
      leaveGroup,
      setUserLocation,
      setMapMode,
    }),
    [
      groupCode,
      userId,
      userLocation,
      members,
      mapMode,
      helpdeskTarget,
      isInitialized,
      joinGroup,
      createGroup,
      leaveGroup,
      setUserLocation,
      setMapMode,
    ]
  );

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
};

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within GroupProvider");
  return ctx;
}
