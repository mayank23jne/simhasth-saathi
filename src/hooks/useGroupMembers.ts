import { useCallback, useEffect, useRef, useState } from 'react';
import { authService } from '@/services/authService';
import { useAppStore } from '@/store/appStore';

export interface GroupMemberApi {
  id: string;
  fullName?: string;
  name?: string;
  mobileNumber?: string;
  phone?: string;
  groupId?: string;
  groupCode?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'member';
  [key: string]: any;
}

export interface UseGroupMembersResult {
  members: GroupMemberApi[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastFetched: number | null;
}

const groupMembersCache: Record<string, { members: GroupMemberApi[]; lastFetched: number }> = {};

export function useGroupMembers(groupId?: string | null): UseGroupMembersResult {
  const [members, setMembers] = useState<GroupMemberApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const cacheKey = groupId || '';
  const inFlight = useRef<Promise<void> | null>(null);

  const fetchMembers = useCallback(async () => {
  if (!groupId) {
    setMembers([]);
    setError(null);
    setLastFetched(null);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Use cache if available and recent (2 min)
    const now = Date.now();
    const cached = groupMembersCache[cacheKey];
    if (cached && now - cached.lastFetched < 2 * 60 * 1000) {
      console.info('using cached members', cached.members.length);
      setMembers(cached.members);
      setLastFetched(cached.lastFetched);
      setLoading(false);
      return;
    }

    // Use the service method
    const raw = await authService.getGroupMembers({ groupId });
    console.info(raw, 'raw from service');

    // Guarantee we have an array (service should already return array but be safe)
    const rawArr: any[] = Array.isArray(raw)
      ? raw
      : raw?.data ?? raw?.group_members ?? raw?.groupMembers ?? [];

    // Validate and normalize
    const normalized: GroupMemberApi[] = rawArr.map((m: any) => {
      // compute boolean for isAdmin (handles 1/0, true/false, '1' etc.)
      const isAdmin =
        m.isAdmin === true ||
        m.is_admin === true ||
        m.isAdmin === 1 ||
        m.is_admin === 1 ||
        m.isAdmin === '1' ||
        m.is_admin === '1';

      const id =
        m.id ??
        m.userId ??
        m.user_id ??
        // sometimes API returns string ids
        (m.id === 0 ? 0 : undefined) ??
        '';

      const fullName = m.fullName ?? m.full_name ?? m.name ?? '';
      const mobileNumber = m.mobileNumber ?? m.mobile_number ?? m.phone ?? '';

      return {
        id: String(id), // stringify to make dedupe consistent
        fullName,
        name: fullName,
        mobileNumber,
        phone: m.phone ?? mobileNumber,
        groupId: m.groupId ?? m.group_id ?? '',
        groupCode: m.groupCode ?? m.group_code ?? '',
        isAdmin,
        role: m.role ?? (isAdmin ? 'admin' : 'member'),
        // keep any other original props
        ...m,
      } as GroupMemberApi;
    });

    // Deduplicate by id (last one wins)
    const dedupMap = new Map<string, GroupMemberApi>();
    for (const mem of normalized) {
      const key = String(mem.id ?? mem.mobileNumber ?? `${mem.fullName}:${mem.phone}`);
      dedupMap.set(key, mem);
    }
    const finalMembers = Array.from(dedupMap.values());
    console.info(finalMembers,"finalMembers 123456")
    console.info({ rawCount: rawArr.length, normalizedCount: normalized.length, finalCount: finalMembers.length }, 'member counts');

    setMembers(finalMembers);
    setLastFetched(now);
    // overwrite cache so next read is correct
    groupMembersCache[cacheKey] = { members: finalMembers, lastFetched: now };
  } catch (e: any) {
    setError(e?.message || 'Unknown error');
  } finally {
    setLoading(false);
  }
}, [groupId, cacheKey]);

  // Only fetch if groupId changes or not cached
  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      setError(null);
      setLastFetched(null);
      return;
    }
    if (groupMembersCache[cacheKey]) {
      setMembers(groupMembersCache[cacheKey].members);
      setLastFetched(groupMembersCache[cacheKey].lastFetched);
      setError(null);
      setLoading(false);
      return;
    }
    if (!inFlight.current) {
      inFlight.current = fetchMembers().finally(() => {
        inFlight.current = null;
      });
    }
  }, [groupId, cacheKey, fetchMembers]);

  const refresh = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refresh, lastFetched };
}
