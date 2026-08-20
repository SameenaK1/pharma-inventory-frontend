// Shared API client utilities used by all service modules
declare global {
  interface Window {
    process?: {
      env?: {
        REACT_APP_API_URL?: string;
      };
    };
  }
}

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return 'http://localhost:8080';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.process?.env?.REACT_APP_API_URL) ||
  'http://localhost:8080';

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

export const getHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

export const toApiError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
};

export const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    window.location.href = '/';
    throw new Error('Unauthorized: Session expired or invalid token');
  }

  return res;
};
