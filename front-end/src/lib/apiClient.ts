import api from '@/services/api';
import { AxiosResponse } from 'axios';


// ─── In-memory token store ─────────────────────────────────────────────────────
// Access token lives here — never in localStorage, never in a cookie JS can read.
// Lost on page refresh intentionally — the silent refresh below restores it.

let _accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  _accessToken = token;

  // Also set on the axios instance so all existing api.get/post calls
  // automatically send the Authorization header — no changes needed elsewhere
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAccessToken = () => {
  _accessToken = null;
  delete api.defaults.headers.common['Authorization'];
};

export const getAccessToken = () => _accessToken;

// ─── Silent refresh ────────────────────────────────────────────────────────────
// Called automatically when any request gets a 401.
// Uses the httpOnly cookie (set by your /auth/refresh endpoint).
// User never sees a "session expired" error.

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await api.post('/auth/refresh');
    const { accessToken } = response.data;
    setAccessToken(accessToken);
    return accessToken;
  } catch {
    // Refresh token is also expired — force re-login
    clearAccessToken();
    window.location.href = '/login';
    return null;
  }
};

// ─── apiFetch ─────────────────────────────────────────────────────────────────
// Drop-in for the E2EE library. Wraps axios + handles 401 silently.

export const apiFetch = async (url: string, options: any = {}) => {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  const doRequest = async () => {
    try {
      let response: AxiosResponse;

      if (method.toUpperCase() === 'GET') {
        response = await api.get(url, { headers, ...rest });
      } else if (method.toUpperCase() === 'POST') {
        response = await api.post(url, body ? JSON.parse(body) : undefined, { headers, ...rest });
      } else {
        response = await api({ url, method, data: body, headers, ...rest });
      }

      return {
        ok: true,
        status: response.status,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
      };
    } catch (error: any) {
      if (error.response) {
        return {
          ok: false,
          status: error.response.status,
          json: async () => error.response.data,
          text: async () => JSON.stringify(error.response.data),
        };
      }
      throw error;
    }
  };

  // First attempt
  const result = await doRequest();

  // If 401 — try to silently refresh and retry once
  if (result.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return result;   // refresh failed, user is being redirected
    return doRequest();             // retry original request with new token
  }

  return result;
};