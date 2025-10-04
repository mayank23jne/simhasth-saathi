// Lightweight API client with token handling and typed helpers
// Uses fetch under the hood with JSON defaults and robust error handling

export interface ApiErrorShape {
	status: number;
	message: string;
	errors?: unknown;
}

export class ApiError extends Error {
	status: number;
	data?: unknown;

	constructor(message: string, status: number, data?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

const TOKEN_KEY = 'authToken';
const USER_TYPE_KEY = 'userType'; // 'admin' | 'member'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<TBody = unknown> {
	method?: HttpMethod;
	body?: TBody;
	headers?: Record<string, string>;
	noAuth?: boolean;
}

export const tokenStorage = {
	get: () => {
		try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
	},
	set: (token: string | null) => {
		try {
			if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
		} catch {}
	},
	clear: () => {
		try { localStorage.removeItem(TOKEN_KEY); } catch {}
	}
};

export const userTypeStorage = {
	get: () => {
		try { return localStorage.getItem(USER_TYPE_KEY) as 'admin' | 'member' | null; } catch { return null; }
	},
	set: (type: 'admin' | 'member' | null) => {
		try {
			if (type) localStorage.setItem(USER_TYPE_KEY, type); else localStorage.removeItem(USER_TYPE_KEY);
		} catch {}
	}
};

const ENV_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL) || 'https://app.jyada.in';

function joinUrl(base: string, path: string): string {
	if (!base) return path;
	const b = base.endsWith('/') ? base.slice(0, -1) : base;
	const p = path.startsWith('/') ? path : `/${path}`;
	return `${b}${p}`;
}

export async function apiFetch<TResponse = unknown, TBody = unknown>(
	url: string,
	options: RequestOptions<TBody> = {}
): Promise<TResponse> {
	const { method = 'GET', body, headers = {}, noAuth = false } = options;

	const initHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...headers,
	};

	const token = tokenStorage.get();
	if (!noAuth && token) {
		initHeaders['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(joinUrl(ENV_BASE, url), {
		method,
		headers: initHeaders,
		body: method === 'GET' || method === 'DELETE' ? undefined : (body ? JSON.stringify(body) : undefined),
	});

	const contentType = response.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const parsed = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

	if (!response.ok) {
		const message = (parsed && (parsed.message || parsed.error)) || response.statusText || 'Request failed';
		throw new ApiError(message, response.status, parsed);
	}

	return (parsed as TResponse);
}

export function setAuth(token: string, type: 'admin' | 'member', extras?: { userId?: string }) {
	tokenStorage.set(token);
	userTypeStorage.set(type);
	try {
		if (extras?.userId) localStorage.setItem('userId', extras.userId);
	} catch {}
}

export function clearAuth() {
	tokenStorage.clear();
	userTypeStorage.set(null);
	try {
		localStorage.removeItem('userId');
	} catch {}
}


