import { apiFetch } from "@/lib/api";

export interface GenerateQRResponse {
  qrId: number | string;
}

export interface BindQRPayload {
  qrId: number | string;
  groupId: string | number;
  fullName: string;
  age: number;
  emergencyContact: string | number;
  address?: string;
}

export const qrService = {
  async generate(): Promise<GenerateQRResponse> {
    const res = await apiFetch<GenerateQRResponse, {}>("/api/qr/generate", {
      method: "POST",
      body: {},
    });
    return res;
  },

  async bind(
    payload: BindQRPayload
  ): Promise<{ success?: boolean } & Record<string, unknown>> {
    return await apiFetch("/api/qr/bind", {
      method: "POST",
      body: payload,
    });
  },
};

export type QRService = typeof qrService;
