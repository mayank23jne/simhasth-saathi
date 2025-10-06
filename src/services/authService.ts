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

export interface JoinExistingGroupPayload {
  userId: string;
  groupId: string;
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

// Normalized helpers for dynamic API responses
export interface NormalizedUser {
	id: string;
	fullName: string;
	mobileNumber: string;
	age?: number;
	groupId?: string | null;
	isAdmin: boolean;
}

export interface NormalizedLoginData {
	token: string | null;
	user: NormalizedUser | null;
	groupMembers: NormalizedUser[];
}

export function normalizeAuthData(res: any): NormalizedLoginData {
	const data = res?.data ?? res ?? {};
	const rawUser = data.user ?? data.User ?? {};
	const token = (data.token ?? res?.token ?? null) as string | null;

	const normalizeUser = (u: any): NormalizedUser | null => {
		if (!u) return null;
		const id = u.id ?? u.userId ?? u.user_id;
		if (id == null) return null;
		return {
			id: String(id),
			fullName: u.fullName ?? u.full_name ?? u.name ?? '',
			mobileNumber: u.mobileNumber ?? u.mobile_number ?? u.phone ?? '',
			age: u.age ?? u.Age,
			groupId: u.groupId ?? u.group_id ?? null,
			isAdmin: Boolean(u.isAdmin ?? u.is_admin ?? false),
		};
	};

	const user = normalizeUser(rawUser);
	const membersRaw: any[] = Array.isArray(data.groupMembers)
		? data.groupMembers
		: (Array.isArray(data.group_members) ? data.group_members : []);
	const groupMembers = membersRaw
		.map((m) => normalizeUser(m))
		.filter((m): m is NormalizedUser => !!m);

	return { token, user, groupMembers };
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
		// Persist auth if token is present in the new response shape
		const norm = normalizeAuthData(res);
		if (norm.token && norm.user?.id) {
			setAuth(norm.token, norm.user.isAdmin ? 'admin' : 'member', { userId: norm.user.id });
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

  async joinExistingGroup(payload: JoinExistingGroupPayload): Promise<any> {
    // Authenticated endpoint to join an existing group
    return await apiFetch('/api/auth/join-existing-group', {
      method: 'POST',
      body: payload,
    });
  },

  async getGroupMembers(payload: { groupId: string }): Promise<any[]> {
  const res = await apiFetch('/api/auth/get-group-users', {
    method: 'POST',
    body: payload,
  });

  // Normalize many possible shapes and always return an array
  const maybe = res?.data ?? res ?? {};
  console.info('raw service response', res);
  // If the top-level value is already an array, return it
  if (Array.isArray(maybe)) return maybe;
  // Common nested shapes:
  if (Array.isArray(maybe.group_members)) return maybe.group_members;
  if (Array.isArray(maybe.groupMembers)) return maybe.groupMembers;
  if (Array.isArray(maybe.data)) return maybe.data;
  // Fallback: if response itself had data that is array (res.data.data)
  if (Array.isArray(res?.data?.data)) return res.data.data;
  // Otherwise return empty array
  return [];
}
};

export type AuthService = typeof authService;


