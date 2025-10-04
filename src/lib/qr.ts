// Centralized QR encoding/decoding for the app

export type QRKind = 'group_invite' | 'member_card' | 'lost_person' | 'help_center' | 'safety_info';

export interface BaseQRPayload {
  v: 1; // version
  kind: QRKind;
  ts?: number;
}

export interface GroupInviteQR extends BaseQRPayload {
  kind: 'group_invite';
  groupCode: string; // 6-char alphanumeric upper-case
}

export interface MemberCardQR extends BaseQRPayload {
  kind: 'member_card';
  id: string;
  name: string;
  groupCode?: string;
  phone?: string;
  age?: number;
  // Optional capture of where the QR was generated
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
}

export type QRPayload = GroupInviteQR | MemberCardQR | (BaseQRPayload & Record<string, unknown>);

export function encodeQR(payload: QRPayload): string {
  const withDefaults: QRPayload = { v: 1, ts: Date.now(), ...payload } as QRPayload;
  return JSON.stringify(withDefaults);
}

export function tryParseQR(text: string): QRPayload | null {
  if (!text) return null;
  // Accept plain group codes or join URLs as well
  try {
    const maybeUrl = new URL(text);
    const joinParam = maybeUrl.searchParams.get('join');
    if (joinParam) {
      return normalizeToGroupInvite(joinParam);
    }
  } catch {}
  // If looks like bare code
  const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 6) {
    return normalizeToGroupInvite(cleaned);
  }
  // JSON case
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object') {
      if (obj.kind === 'group_invite' && typeof obj.groupCode === 'string') {
        return { v: 1, ts: obj.ts ?? Date.now(), kind: 'group_invite', groupCode: normalizeCode(obj.groupCode) };
      }
      if (obj.kind === 'member_card' && typeof obj.id === 'string') {
        return {
          v: 1,
          ts: obj.ts ?? Date.now(),
          kind: 'member_card',
          id: obj.id,
          name: obj.name ?? 'Member',
          groupCode: obj.groupCode ? normalizeCode(obj.groupCode) : undefined,
          phone: obj.phone,
          age: typeof obj.age === 'number' ? obj.age : undefined,
          latitude: typeof obj.latitude === 'number' ? obj.latitude : undefined,
          longitude: typeof obj.longitude === 'number' ? obj.longitude : undefined,
          locationName: typeof obj.locationName === 'string' ? obj.locationName : undefined,
          address: typeof obj.address === 'string' ? obj.address : undefined,
        };
      }
      // allow unknown kinds to pass through for forward-compat
      if (typeof obj.kind === 'string') {
        return { v: 1, ts: obj.ts ?? Date.now(), kind: obj.kind, ...obj } as QRPayload;
      }
    }
  } catch {}
  return null;
}

function normalizeToGroupInvite(code: string): GroupInviteQR | null {
  const norm = normalizeCode(code);
  if (norm.length !== 6) return null;
  return { v: 1, ts: Date.now(), kind: 'group_invite', groupCode: norm };
}

function normalizeCode(code: string): string {
  return (code || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}



