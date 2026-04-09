import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Point this to your deployed Laravel API (same as frontend NEXT_PUBLIC_API_URL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const STORAGE_KEY_TOKEN = 'appan_token';
const STORAGE_KEY_USER = 'appan_user';

apiClient.interceptors.request.use(
  async (config) => {
    // Token will be injected by AuthContext via setAuthToken
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      // Token is no longer valid; clear local session so next app navigation can re-auth.
      try {
        await Promise.all([AsyncStorage.removeItem(STORAGE_KEY_TOKEN), AsyncStorage.removeItem(STORAGE_KEY_USER)]);
      } catch {
        // ignore
      }
      setAuthToken(null);
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

