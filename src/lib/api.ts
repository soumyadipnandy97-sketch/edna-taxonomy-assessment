import { auth } from './firebase';

let memorySessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  memorySessionToken = token;
}

export function getSessionToken(): string | null {
  return memorySessionToken;
}

export async function getActiveBearerToken(): Promise<string | null> {
  if (memorySessionToken) {
    return memorySessionToken;
  }
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken();
    } catch {
      return null;
    }
  }
  return null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders || {});

  if (!skipAuth) {
    const token = await getActiveBearerToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!(rest.body instanceof FormData) && !headers.has('Content-Type') && rest.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...rest,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: string }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
