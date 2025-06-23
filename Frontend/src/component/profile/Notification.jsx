import { useState, useEffect, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const NotificationComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // WebSocket setup with proper connection handling
  useEffect(() => {
    if (!isOpen || !token) return;
  
    // Use secure WebSocket and current host
    const wsUrl = `wss://${window.location.host}/ws/notifications/?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('WebSocket message:', data);

        if (data.type === 'notification.message') {
          const message = data.message;
          
          // Handle different notification types
          switch(message.type) {
            case 'game_notification':
              if (message.action === 'invite_rejected') {
                alert(message.message);
              }
              fetchNotifications();
              break;
            
            case 'friend_request':
            case 'game_invite':
              fetchNotifications();
              break;
            
            default:
              fetchNotifications();
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    const handleError = (e) => {
      console.error('WebSocket error:', e);
    };

    const handleClose = (e) => {
      console.log('WebSocket closed:', e.code);
      if (e.code !== 1000 && isOpen) {
        setTimeout(() => setSocket(new WebSocket(wsUrl)), 5000);
      }
    };

    ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      setSocket(ws);
    });

    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('close', handleClose);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmount');
      }
    };
  }, [isOpen, token]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.post(
        `/notifications/${notificationId}/read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post(
        '/notifications/mark-all-read/',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const navigateToUserProfile = async (notification) => {
    try {
      const response = await api.get(
        `/users/${notification.sender_intra_id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOpen(false);
      await markAsRead(notification.id);
      navigate(`/profile/${notification.sender_intra_id}`);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      alert("Could not find this user's profile");
    }
  };

  const handleGameInviteAction = async (notificationId, action) => {
    try {
      const response = await api.post(
        `/notifications/game-invite/${notificationId}/`,
        { action },
        { 
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500
        }
      );
  
      if (action === "accept" && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
        return;
      }
  
      await markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
  
    } catch (error) {
      console.error("Game invite error:", error);
      alert(error.response?.data?.error || "Failed to process invite");
    }
  };

  const getNotificationContent = (notification) => {
    switch (notification.notification_type) {
      case 'friend_request':
        return (
          <div className="cursor-pointer" onClick={() => navigateToUserProfile(notification)}>
            <p className="font-semibold">{notification.sender_name}</p>
            <p className="text-sm">vous a envoyé une demande d'ami</p>
          </div>
        );

      case 'game_invite':
        return (
          <div>
            <p className="font-semibold">{notification.sender_name}</p>
            <p className="text-sm">vous invite à jouer une partie</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGameInviteAction(notification.id, "accept");
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Accepter
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGameInviteAction(notification.id, "reject");
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Rejeter
              </button>
            </div>
          </div>
        );

      case 'game_ready':
        return (
          <div className="space-y-2">
            <p className="font-semibold">⏰ Partie Prête!</p>
            <p className="text-sm">{notification.content}</p>
            <button
              onClick={() => window.location.href = notification.redirect_url}
              className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Rejoindre la partie
            </button>
          </div>
        );

      case 'invite_rejected':
        return (
          <div className="text-red-600">
            <p className="font-semibold">❌ Invitation Rejetée</p>
            <p className="text-sm">{notification.content}</p>
          </div>
        );

      case 'message':
        return (
          <div className="cursor-pointer hover:bg-gray-50">
            <p className="font-semibold">{notification.sender_name}</p>
            <p className="text-sm">Nouveau message: {notification.content}</p>
          </div>
        );

      default:
        return (
          <div className="cursor-pointer hover:bg-gray-50">
            <p className="font-semibold">{notification.sender_name}</p>
            <p className="text-sm">{notification.content}</p>
          </div>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full bg-[#5376aa] hover:bg-gray-400"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500">Aucune notification</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:bg-gray-100 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => !notification.notification_type.includes('game_invite') && markAsRead(notification.id)}
                >
                  <div className="flex justify-between">
                    <div className="flex-grow">
                      {getNotificationContent(notification)}
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="ml-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationComponent;