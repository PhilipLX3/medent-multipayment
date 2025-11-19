import api from '@/shared/services/api';
import { ApiResponse, User } from '@/shared/types';
import toast from 'react-hot-toast';

interface BackendUser {
  id: number;
  uuid: string;
  status: string;
  createdAt: string;
  profile: {
    email: string;
    firstName: string;
    firstNameKana: string | null;
    lastName: string;
    lastNameKana: string | null;
    mobile: string | null;
  };
}

interface BackendClinic {
  id: number;
  uuid: string;
  code: string;
  name: string;
  status: string;
  isPrimary: boolean;
}

interface BackendLoginResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: BackendUser;
    clinics: BackendClinic[];
  };
}

interface BackendRefreshResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const authService = {
  login: (email: string, password: string) => {
    const endpoint = '/v1/auth/login';
    return api.post<BackendLoginResponse>(endpoint, {
      email,
      password,
    });
  },

  me: () => {
    return api.get<ApiResponse<{ user: User }>>('/v1/auth/me');
  },

  refreshToken: async (refreshToken: string) => {
    try {
      return await api.post<BackendRefreshResponse>('/v1/auth/refresh-token', {
        refreshToken,
      });
    } catch (error: any) {
      console.error('[AuthService] Refresh token failed:', error);
      
      // Log detailed error information for debugging
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      const statusCode = error?.response?.status || 'No status';
      console.log('[AuthService] Error details:', {
        statusCode,
        message: errorMessage,
        fullError: error?.response?.data
      });
      
      // If refresh token API fails (401, 403, or any other error), redirect to login
      if (typeof window !== 'undefined') {
        console.log('[AuthService] Redirecting to login due to refresh token failure');
        
        // Show simple user-friendly message based on status code
        const toastMessage = statusCode === 401 
          ? 'セッションが終了しました。再度ログインしてください。'
          : 'ログインの有効期限が切れました。再度ログインしてください。';
          
        toast.error(toastMessage, {
          duration: 3000,
        });
        
        // Small delay to allow toast to show, then redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      // Re-throw the error so the calling code can handle it
      throw error;
    }
  },

  changePassword: (oldPassword: string, newPassword: string) => {
    return api.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};