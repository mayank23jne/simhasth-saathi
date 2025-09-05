import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UniqueId = string;

export interface GeoPoint { lat: number; lng: number }

export interface MemberPathPoint extends GeoPoint { ts: number }

export interface GroupMember {
	id: UniqueId;
	name: string;
	phone?: string;
	groupCode?: string;
	position?: GeoPoint;
	lastUpdated?: number;
	isSelf?: boolean;
	headingDeg?: number;
	path?: MemberPathPoint[];
}

export type SosStatus = 'idle' | 'sent' | 'responded' | 'resolved';

export interface SosAlert {
	id: UniqueId;
	createdAt: number;
	status: Exclude<SosStatus, 'idle'>;
	responder?: string;
}

export interface LostFoundReport {
	id: UniqueId;
	name: string;
	age?: number;
	description?: string;
	lastSeen?: string;
	createdAt: number;
	found?: boolean;
}

export interface QrScanResult {
	id: UniqueId;
	name: string;
	phone?: string;
	groupCode?: string;
}

export interface MapMarker {
	id: UniqueId;
	label?: string;
	position: GeoPoint;
}

export interface AppState {
	// Identity / group
	groupCode: string | null;
	userId: string | null;
	userLocation: GeoPoint | null;

	// Entities
	members: GroupMember[];
	sosAlerts: SosAlert[];
	reports: LostFoundReport[];
	qrScans: QrScanResult[];
	mapMarkers: MapMarker[];

	// Actions
	setGroup: (groupCode: string | null) => void;
	setUserId: (userId: string | null) => void;
	setUserLocation: (lat: number, lng: number) => void;

	addMember: (member: GroupMember) => void;
	removeMember: (memberId: UniqueId) => void;
	updateMember: (memberId: UniqueId, update: Partial<GroupMember>) => void;
	clearMembers: () => void;

	triggerSOS: () => SosAlert;
	updateSOS: (id: UniqueId, update: Partial<SosAlert>) => void;
	clearSOS: () => void;

	submitReport: (report: Omit<LostFoundReport, 'id' | 'createdAt'>) => LostFoundReport;
	markFound: (id: UniqueId, found?: boolean) => void;
	clearReports: () => void;

	addQrScan: (scan: QrScanResult) => void;
	removeQrScan: (id: UniqueId) => void;
	clearQrScans: () => void;

	addMarker: (marker: MapMarker) => void;
	updateMarker: (id: UniqueId, update: Partial<MapMarker>) => void;
	removeMarker: (id: UniqueId) => void;
	clearMarkers: () => void;
}

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			groupCode: localStorage.getItem('groupCode') || null,
			userId: localStorage.getItem('userId') || null,
			userLocation: null,

			members: [],
			sosAlerts: [],
			reports: [],
			qrScans: [],
			mapMarkers: [],

			setGroup: (groupCode) => {
				if (groupCode) localStorage.setItem('groupCode', groupCode); else localStorage.removeItem('groupCode');
				set({ groupCode });
			},
			setUserId: (userId) => {
				if (userId) localStorage.setItem('userId', userId); else localStorage.removeItem('userId');
				set({ userId });
			},
			setUserLocation: (lat, lng) => {
				const currentUserId = get().userId || generateId('usr');
				if (!get().userId) set({ userId: currentUserId });
				const nextLocation = { lat, lng };
				set({ userLocation: nextLocation });
				// ensure self member exists/updates
				set((state) => {
					const existingSelf = state.members.find(m => m.isSelf);
					if (existingSelf) {
						const basePath = existingSelf.path || [];
						const nextPath = [...basePath, { lat, lng, ts: Date.now() }];
						return {
							members: state.members.map(m => m.isSelf ? {
								...m,
								id: currentUserId,
								position: nextLocation,
								lastUpdated: Date.now(),
								path: nextPath.slice(Math.max(0, nextPath.length - 50)),
							} : m)
						};
					}
					return {
						members: [{
							id: currentUserId,
							name: 'You',
							isSelf: true,
							position: nextLocation,
							lastUpdated: Date.now(),
							path: [{ lat, lng, ts: Date.now() }],
						}, ...state.members]
					};
				});
			},

			addMember: (member) => set((state) => ({ members: [...state.members, { ...member, id: member.id || generateId('mem') }] })),
			removeMember: (memberId) => set((state) => ({ members: state.members.filter(m => m.id !== memberId) })),
			updateMember: (memberId, update) => set((state) => ({ members: state.members.map(m => m.id === memberId ? { ...m, ...update, lastUpdated: Date.now() } : m) })),
			clearMembers: () => set({ members: [] }),

			triggerSOS: () => {
				const alert: SosAlert = { id: generateId('sos'), createdAt: Date.now(), status: 'sent' };
				set((state) => ({ sosAlerts: [alert, ...state.sosAlerts] }));
				return alert;
			},
			updateSOS: (id, update) => set((state) => ({ sosAlerts: state.sosAlerts.map(a => a.id === id ? { ...a, ...update } : a) })),
			clearSOS: () => set({ sosAlerts: [] }),

			submitReport: (report) => {
				const entry: LostFoundReport = { id: generateId('rep'), createdAt: Date.now(), found: false, ...report };
				set((state) => ({ reports: [entry, ...state.reports] }));
				return entry;
			},
			markFound: (id, found = true) => set((state) => ({ reports: state.reports.map(r => r.id === id ? { ...r, found } : r) })),
			clearReports: () => set({ reports: [] }),

			addQrScan: (scan) => set((state) => ({ qrScans: [{ ...scan, id: scan.id || generateId('scan') }, ...state.qrScans] })),
			removeQrScan: (id) => set((state) => ({ qrScans: state.qrScans.filter(s => s.id !== id) })),
			clearQrScans: () => set({ qrScans: [] }),

			addMarker: (marker) => set((state) => ({ mapMarkers: [...state.mapMarkers, { ...marker, id: marker.id || generateId('mk') }] })),
			updateMarker: (id, update) => set((state) => ({ mapMarkers: state.mapMarkers.map(m => m.id === id ? { ...m, ...update } : m) })),
			removeMarker: (id) => set((state) => ({ mapMarkers: state.mapMarkers.filter(m => m.id !== id) })),
			clearMarkers: () => set({ mapMarkers: [] }),
		}),
		{
			name: 'simhastha-app-store',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				groupCode: state.groupCode,
				userId: state.userId,
				userLocation: state.userLocation,
				members: state.members,
				sosAlerts: state.sosAlerts,
				reports: state.reports,
				qrScans: state.qrScans,
				mapMarkers: state.mapMarkers,
			}),
		}
	)
);

export type AppStore = ReturnType<typeof useAppStore>;


