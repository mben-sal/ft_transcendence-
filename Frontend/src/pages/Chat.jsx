// Chat.jsx - Responsive Version
import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatConversation from "../component/chat/chat-convesation";
import { chatService } from '../services/api_chat';
import api from '../api/axios';
import { useUser } from '../contexts/UserContext';

const Chat = () => {
  const { user } = useUser();
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [socket, setSocket] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  useEffect(() => {
    loadFriends();
    if (roomId) {
      loadConversations();
      loadprivateConversation();
    }
  }, [roomId]);

  useEffect(() => {
    // Handle responsive sidebar visibility
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const filtered = conversations.filter(conv => 
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages?.[0]?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const loadFriends = async () => {
    try {
      const response = await api.get('users/friends/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
      setFriendsLoading(false);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriendsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getMessages(roomId);
      setAllMessages(data.messages);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const loadprivateConversation = async () => {
    if (!roomId) return;
    try {
      const data = await chatService.getRooms(roomId);
      const myusername = user?.intra_id;
      const friendusername = myusername === data.members[1] ? data.members[0] : data.members[1];
      const response = await api.get('users/friends/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let friend_obj = {
        id: null,
        username: null,
        avatar: null,
        full_name: null,
      };
      
      response.data.forEach(friendship => {
        if(friendusername === friendship.sender_intra_id) {
          friend_obj.id = friendship.sender_id;
          friend_obj.username = friendship.sender_intra_id;
          friend_obj.avatar = friendship.sender_avatar;
          friend_obj.full_name = friendship.sender_name;
        } else if (friendusername === friendship.receiver_intra_id) {
          friend_obj.id = friendship.receiver_id;
          friend_obj.username = friendship.receiver_intra_id;
          friend_obj.avatar = friendship.receiver_avatar;
          friend_obj.full_name = friendship.receiver_name;
        }
      });
      
      setSelectedChat(friend_obj);
      
      // On mobile, hide sidebar once chat is selected
      if (window.innerWidth < 768) {
        setSidebarVisible(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStartChat = async (friend) => {
    try {
      // Create a room name combining both user IDs
      const roomName = `room_${user.id}_${friend.id}`;
      
      // Create or get existing conversation
      const response = await chatService.createConversation(
        roomName, 
        true, 
        [friend.id]
      );
      
      navigate(`/chat?room=${response.conversation_id}`, { replace: true });
      
      // Load the conversation
      loadprivateConversation();
      
      // On mobile, hide sidebar once chat is selected
      if (window.innerWidth < 768) {
        setSidebarVisible(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSearch = (term) => setSearchTerm(term);
  
  useEffect(() => {
    if (!isOpen || !token) {
      return;
    }
  
    const wsUrl = `wss://${window.location.host}/ws/prvchat/${user.intra_id}/`;
    const ws = new WebSocket(wsUrl);
  
    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setAllMessages(prevMessages => [...prevMessages, data]);
        
        if (data.type === 'chat_message') {
          setSelectedChat(prev => {
            if (!prev || (prev.user !== data.sender && prev.user !== data.receiver)) {
              return prev;
            }
            return {
              ...prev,
              messages: [
                ...(prev.messages || []),
                {
                  id: Date.now(),
                  content: data.content,
                  sender: data.sender,
                  receiver: data.receiver,
                  created_at: data.timestamp,
                  is_sent: data.is_sent
                }
              ]
            };
          });
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
  }, [isOpen, token, roomId, user?.intra_id]);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(90vh-2rem)] flex flex-col md:flex-row gap-2 md:gap-4 p-2 overflow-hidden">
      {/* Mobile toggle button - only visible on small screens */}
      <button
        className="md:hidden w-full py-2 px-4 bg-blue-500 text-white rounded-lg mb-2 flex items-center justify-center"
        onClick={toggleSidebar}
      >
        <Users className="mr-2" size={18} />
        {sidebarVisible ? 'Hide Friends' : 'Show Friends'}
      </button>
      
      {/* Friends List Sidebar */}
      {sidebarVisible && (
        <div className="w-full md:w-64 lg:w-80 bg-white rounded-lg shadow-sm p-2 md:p-4 overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-800">Friends</h2>
            <Users className="text-gray-500" size={20} />
          </div>
          
          {friendsLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-1 md:space-y-2">
              {friends.map((friendship) => {
                // Determine if current user is sender or receiver in the friendship
                const isSender = friendship.sender_intra_id === user.intra_id;
                const friend = {
                  id: isSender ? friendship.receiver_id : friendship.sender_id,
                  username: isSender ? friendship.receiver_intra_id : friendship.sender_intra_id,
                  avatar: isSender ? friendship.receiver_avatar : friendship.sender_avatar,
                  full_name: isSender ? friendship.receiver_name : friendship.sender_name
                };
                
                return (
                  <div
                    key={friend.id}
                    className={`flex items-center p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedChat?.id === friend.id ? 'bg-blue-50 border border-blue-100' : ''
                    }`}
                    onClick={() => handleStartChat(friend)}
                  >
                    <img
                      src={friend.avatar || 'default-avatar-url'}
                      alt={friend.full_name}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover mr-2 md:mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm md:text-base">{friend.full_name}</h3>
                      <p className="text-xs text-gray-500">@{friend.username}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-h-0">
        {selectedChat ? (
          <ChatConversation 
            myuserobj={user}
            user={selectedChat}
            messages={allMessages}
            onSendMessage={socket ? socket.send.bind(socket) : null}
            onClose={() => setSelectedChat(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 bg-white rounded-lg shadow-sm">
            <div className="text-center p-4">
              <Users className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" />
              <p className="text-sm md:text-base">Select a friend to start chatting</p>
              <p className="text-xs md:text-sm mt-1">or search for friends above</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
