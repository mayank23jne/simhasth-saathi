import { apiFetch } from "../lib/api";

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
  success: boolean;
  data: Array<{
    id: number;
    full_name: string;
    latitude: string;
    longitude: string;
    created_at: string;
  }>;
}

export const locationService = {
  async updateLocation(
    payload: UpdateLocationPayload
  ): Promise<{ success: boolean } & Partial<LocationPoint>> {
    return await apiFetch("/api/location/update", {
      method: "POST",
      body: payload,
    });
  },

  async getLatest(): Promise<LatestLocationResponse> {
    return await apiFetch("/api/location/latest", {
      method: "GET",
    });
  },

  async getGroupLocations(payload?: {
    groupId?: string;
  }): Promise<GroupLocationsResponse> {
    return await apiFetch("/api/location/group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? payload : undefined,
    });
  },
};

export type LocationService = typeof locationService;
