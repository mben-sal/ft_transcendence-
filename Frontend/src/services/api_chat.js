import { AUTH_CONFIG } from '../config';
import axios from 'axios'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
      headers: {
          'Authorization': `Bearer ${token}`
      }
  };
};

//api/blocks/
export const chatService = {
  async getConversations() {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getBlockedList() {
    try {
      const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/blocks/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch blocked list');
      const data = await response.json();
      return data.data; // Access the nested data array
    } catch (error) {
      console.error("Error fetching blocked list:", error);
      return []; // Return empty array on error
    }
  },
  
  async blockFriend(friend_id) {
    try {
      const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/blocks/${friend_id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to block user');
      return data;
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error; // Re-throw to handle in component
    }
  },
  async unBlockFriend(friend_id) {
    try {
      const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/blocks/${friend_id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to unblock user');
      return data;
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  },
  async getRooms(room_id) {
    console.log("room_id\n=",room_id);
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/rooms/${room_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getMessages(room_id) {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/${room_id}/messages/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async sendMessage(conversationId, content) {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/${conversationId}/send_message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },

  async createPrivateChat(userId) {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        type: 'private',
        participants: [userId]
      })
    });
    return response.json();
  },

  createConversation: async (name, isDirectChat = false, memberIds = []) => {
      try {
          const response = await axios.post(
              `https://${window.location.host}/api/chat/rooms/`,
              {
                  name,
                  is_direct: isDirectChat,
                  members: memberIds
              },
              getAuthHeaders()
          );
          return response.data;
      } catch (error) {
          console.error('Erreur lors de la création de la conversation:', error);
          throw error;
      }
  },

  async createGroupChat(name, participants, description) {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        type: 'group',
        name,
        participants,
        description
      })
    });
    return response.json();
  },

  async markAsRead(conversationId) {
    const response = await fetch(`${AUTH_CONFIG.VITE_API_URL}/conversations/${conversationId}/mark_read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }
};