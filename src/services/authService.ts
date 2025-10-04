import { apiFetch, ApiError, setAuth } from '../lib/api';

export interface RegisterUserPayload {
	fullName: string;
	mobileNumber: string;
	age: number;
}

export interface RegisterMemberPayload extends RegisterUserPayload {
	groupId: string;
}

export interface LoginPayload {
	mobileNumber: string;
}

export interface VerifyOtpPayload {
	userId: string;
	otp: string;
	userType: 'admin' | 'member';
}

export interface CreateGroupPayload {
  adminId: string | number;
}

export interface AuthResponse {
	userId: string;
	userType: 'admin' | 'member';
	token?: string; // may be returned on verify
	groupId?: string | null;
	message?: string;
	success?: boolean;
	data?: {
		userId?: string;
	};
}

export const authService = {
	async registerAdmin(payload: RegisterUserPayload): Promise<AuthResponse> {
		const res = await apiFetch<AuthResponse, RegisterUserPayload>('/api/auth/register-user', {
			method: 'POST',
			body: payload,
			noAuth: true,
		});
		// If backend returns token immediately on register, persist it
		const token = (res as any)?.data?.token as string | undefined;
		const user = (res as any)?.data?.user as { id?: string | number; isAdmin?: boolean } | undefined;
		if (token && user?.id != null) {
			setAuth(token, user?.isAdmin ? 'admin' : 'member', { userId: String(user.id) });
		}
		return res;
	},

	async registerMember(payload: RegisterMemberPayload): Promise<AuthResponse> {
		const res = await apiFetch<AuthResponse, RegisterMemberPayload>('/api/auth/register-member', {
			method: 'POST',
			body: payload,
			noAuth: true,
		});
		return res;
	},

	async loginAdmin(payload: LoginPayload): Promise<AuthResponse> {
		const res = await apiFetch<AuthResponse, LoginPayload>('/api/auth/login-user', {
			method: 'POST',
			body: payload,
			noAuth: true,
		});
		// If backend returns token on login, persist it
		const token = (res as any)?.data?.token as string | undefined;
		const user = (res as any)?.data?.user as { id?: string | number; isAdmin?: boolean } | undefined;
		if (token && user?.id != null) {
			setAuth(token, user?.isAdmin ? 'admin' : 'member', { userId: String(user.id) });
		}
		return res;
	},

	async loginMember(payload: LoginPayload): Promise<AuthResponse> {
		const res = await apiFetch<AuthResponse, LoginPayload>('/api/auth/login-member', {
			method: 'POST',
			body: payload,
			noAuth: true,
		});
		return res;
	},

	async verifyOtp(payload: VerifyOtpPayload, options?: { suppressAuth?: boolean }): Promise<AuthResponse> {
		const res = await apiFetch<AuthResponse, VerifyOtpPayload>('/api/auth/verify-otp', {
			method: 'POST',
			body: payload,
			noAuth: true,
		});
		// Support both flat and nested data responses
		const nestedToken = (res as any)?.data?.token as string | undefined;
		const nestedUser = (res as any)?.data?.user as { id?: string | number; isAdmin?: boolean } | undefined;
		const flatToken = (res as any)?.token as string | undefined;
		const flatUserId = (res as any)?.userId as string | number | undefined;
		const token = nestedToken || flatToken;
		const userId = (nestedUser?.id != null ? String(nestedUser.id) : (flatUserId != null ? String(flatUserId) : undefined));
		const userType: 'admin' | 'member' = nestedUser?.isAdmin ? 'admin' : 'member';
		if (token && !options?.suppressAuth && userId) {
			setAuth(token, userType, { userId });
		}
		return res;
	},

	async createGroup(payload: CreateGroupPayload): Promise<any> {
		// Authenticated endpoint to create a group
		return await apiFetch('/api/auth/create-group', {
			method: 'POST',
			body: payload,
		});
	},
};

export type AuthService = typeof authService;


