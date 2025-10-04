import { apiFetch } from '../lib/api';

export interface UpdateLocationPayload {
	latitude: number;
	longitude: number;
}

export interface LocationPoint {
	latitude: number;
	longitude: number;
	timestamp?: number;
	userId?: string;
	name?: string;
}

export interface LatestLocationResponse {
	location: LocationPoint | null;
}

export interface GroupLocationsResponse {
	locations: LocationPoint[];
}

export const locationService = {
	async updateLocation(payload: UpdateLocationPayload): Promise<{ success: boolean } & Partial<LocationPoint>> {
		return await apiFetch('/api/location/update', {
			method: 'POST',
			body: payload,
		});
	},

	async getLatest(): Promise<LatestLocationResponse> {
		return await apiFetch('/api/location/latest', {
			method: 'GET',
		});
	},

	async getGroupLocations(): Promise<GroupLocationsResponse> {
		return await apiFetch('/api/location/group', {
			method: 'GET',
		});
	},
};

export type LocationService = typeof locationService;


