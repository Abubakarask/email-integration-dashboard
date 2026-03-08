import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from './types';

export interface GmailStatusResponse {
  status: 'connected' | 'not_connected';
  message: string;
  google_user_email?: string;
  last_synced_at?: string;
  synced_days?: number;
}

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/login', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/register', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/logout');
    localStorage.removeItem('access_token');
    return response.data;
  },

  me: async (): Promise<any> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  connectGmail: async (): Promise<{ message: string; auth_url: string }> => {
    const response = await apiClient.get('/gmail/connect');
    return response.data;
  },

  getGmailStatus: async (): Promise<GmailStatusResponse> => {
    const response = await apiClient.get('/gmail/status');
    return response.data;
  },

  disconnectGmail: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete('/gmail/disconnect');
    return response.data;
  },
};
