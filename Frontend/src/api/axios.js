import axios from "axios";
// import { API_BASE_URL } from "../config";
import { API_BASE_URL } from "/src/config.js";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enables cookies for CORS requests
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Add token to requests if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Try to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/token/refresh/`, 
          { refresh: refreshToken }
        );
        
        if (response.data.access) {
          localStorage.setItem("token", response.data.access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods for profile and media
const profileApi = {
  // Get user profile
  getProfile: () => api.get('/users/profile/'),
  
  // Update user profile
  updateProfile: (data) => api.put('/users/profile/', data),
  
  // Upload avatar
  uploadAvatar: (formData) => api.post('/users/avatar/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Delete avatar
  deleteAvatar: () => api.delete('/users/avatar/'),
  
  // Get user by ID
  getUserById: (userId) => api.get(`/users/${userId}/`),
  
  // Get user by intra ID
  getUserByIntraId: (intraId) => api.get(`/users/${intraId}/`),
};

// API methods for authentication
const authApi = {
  // Login with username/password
  login: (credentials) => api.post('/users/login/', credentials),
  
  // Logout
  logout: (refreshToken) => api.post('/users/logout/', { refresh_token: refreshToken }),
  
  // Verify 2FA
  verifyTwoFactor: (data) => api.post('/users/verify-2fa/', data),
  
  // Request password reset
  requestPasswordReset: (email) => api.post('/users/password-reset/', { email }),
  
  // Confirm password reset
  confirmPasswordReset: (data) => api.post('/users/password-reset-confirm/', data),
};

// Export both the axios instance and the API methods
export default api;
export { profileApi, authApi };