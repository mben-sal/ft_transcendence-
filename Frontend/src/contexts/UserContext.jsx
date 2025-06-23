import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
// import  {API_BASE_URL } from '../config';
import defaultAvatar from '../assets/src/player_.svg';

const normalizeAvatarUrl = (avatar) => {
  if (!avatar) return defaultAvatar;
  
  // If it's already a full URL, use it as is
  if (avatar.startsWith('http')) return avatar;
  
  // If it's a media path with or without leading slash, construct the full URL
  if (avatar.startsWith('/media') || avatar.startsWith('media')) {
    const path = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `https://${window.location.host}${path}`;
  }
  
  // For relative paths that start with ./media
  if (avatar.startsWith('./media')) {
    return `https://${window.location.host}${avatar.substring(1)}`;
  }
  
  // If none of the above, assume it's the default avatar
  return defaultAvatar;
};

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // Fonction pour mettre à jour le statut
  const updateStatus = async (status = 'online') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.post('/users/status/', 
        { status },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Ping périodique pour maintenir le statut
  useEffect(() => {
    let pingInterval;
    
    if (isAuthenticated) {
      // Appel initial
      updateStatus('online');
      
      pingInterval = setInterval(() => {
        if (localStorage.getItem('token')) {
          updateStatus('online');
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // 30 secondes
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [isAuthenticated]);

  // Méthode de logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Forcer le statut offline avant tout
      if (token) {
        try {
          await updateStatus('offline');
        } catch (error) {
          console.error('Error updating status:', error);
        }
      }
      
      // Faire le logout
      if (refreshToken && token) {
        await api.post('/users/logout/', { refresh_token: refreshToken }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUserData();
    }
  };

  const clearUserData = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        clearUserData();
        setLoading(false);
        return null;
      }

      const response = await api.get('/users/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data;
      
      // Normalize the avatar URL
      userData.avatar = normalizeAvatarUrl(userData.avatar);
      
      // Update online status if needed
      if (userData.status !== 'online') {
        await updateStatus('online');
        userData.status = 'online';
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (newData) => {
    try {
      if (newData.avatar && newData.avatar.startsWith('/media')) {
        newData.avatar = `${API_BASE_URL}${newData.avatar}`;
      }
      setUser(newData);
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Gestion de la déconnexion lors de la fermeture de la fenêtre
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // La propriété keepalive garantit que la requête s'exécute même quand la page se ferme
            fetch(`${API_BASE_URL}/users/status/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ status: 'offline' }),
              keepalive: true
            });

            // Utiliser aussi navigator.sendBeacon comme fallback
            const blob = new Blob([JSON.stringify({ status: 'offline' })], {
              type: 'application/json'
            });
            
            navigator.sendBeacon(
              `${API_BASE_URL}/users/status/`,
              blob
            );
          } catch (e) {
            console.error("Error during offline status update:", e);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);

  // Récupération du profil utilisateur
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Statut online/offline basé sur la visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isAuthenticated) {
        // L'utilisateur quitte la page
        updateStatus('offline');
      } else if (document.visibilityState === 'visible' && isAuthenticated) {
        // L'utilisateur revient sur la page
        updateStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        setUser,
        updateUser,
        loading, 
        isAuthenticated, 
        setIsAuthenticated,
        fetchUserProfile,
        logout,
        updateStatus,
        normalizeAvatarUrl
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);