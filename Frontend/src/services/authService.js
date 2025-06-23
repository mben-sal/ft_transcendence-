import axios from "axios";
import { AUTH_CONFIG } from "/src/config.js";

// Création d'une instance axios avec la configuration de base
const api = api.create({
  baseURL: AUTH_CONFIG.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
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

// Intercepteur pour gérer le rafraîchissement automatique du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await authService.refreshToken(refreshToken);
        localStorage.setItem("token", response.access);

        originalRequest.headers.Authorization = `Bearer ${response.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  async login(email, password) {
    try {
      const response = await api.post("/api/users/login/", {
        email,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Une erreur est survenue lors de la connexion";
      throw new Error(message);
    }
  },

  async loginWith42(code, state) {
    try {
      const response = await api.post("/api/auth/42/callback/", {
        code,
        state,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'authentification avec 42";
      throw new Error(message);
    }
  },

  async refreshToken(refreshToken) {
    try {
      const response = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });
      return response.data;
    } catch (error) {
      throw new Error("Impossible de rafraîchir le token");
    }
  },

  logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      // Autres nettoyages si nécessaire
      return true;
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return false;
    }
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getRefreshToken() {
    return localStorage.getItem("refresh_token");
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Vérification basique de l'expiration du token (si JWT)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return !!token; // Fallback si le token n'est pas un JWT valide
    }
  },

  // Fonction utilitaire pour vérifier si un token est expiré
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  },
};

export default authService;
