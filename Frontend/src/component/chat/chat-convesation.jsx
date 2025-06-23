// chat-conversation.jsx - Responsive Version
import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical } from 'lucide-react';
import PropTypes from 'prop-types';
import './chat.css';
import player_ from '../../assets/src/player_.svg';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/api_chat';

export const ChatConversation = ({ myuserobj, user, messages = [], onSendMessage, onClose, onBlock = () => {} }) => {
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isBlock, setBlock] = useState(false);
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchParams = new URLSearchParams(window.location.search);
  const room_id = searchParams.get('room');
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState("offline");

  // Handle clicking outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      const jsonMessage = JSON.stringify({
        "sender": myuserobj.intra_id,
        "receiver": user.username,
        "room_id": room_id,
        "message": message,
      });
      onSendMessage(jsonMessage);
      setMessage('');
    }
  };

  const handleMenuAction = () => {
    setShowMenu(false);
    navigate(`/game/friend`);
  };

  const handleUnBlock = async () => {
    try {
      const res = await chatService.unBlockFriend(user.id);
      if (res.success) {
        setBlock(false);
        console.log(`You have unblocked ${user.username}`);
      }
    } catch (error) {
      console.error(error.message || "Failed to unblock user");
    }
  };

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const blockList = await chatService.getBlockedList();
        const isUserBlocked = blockList.some(
          blockedUser => blockedUser.blocked_user.id === user.id
        );
        setBlock(isUserBlocked);
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };
  
    checkBlockStatus();
  }, [user.id]);

  const handleBlock = async () => {
    try {
      if(isBlock) {
        handleUnBlock();
        return;
      }
      const res = await chatService.blockFriend(user.id);
      if (res.success) {
        setBlock(true);
        console.log(`You have blocked ${user.username}`);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  // Using optional chaining and default values for user properties
  const userName = user?.username || 'User';
  const userAvatar = user?.avatar || player_;
  
  const isMessageForCurrentUser = (message) => {
    return message.receiver === myuserobj.intra_id || 
           (message.room_id && room_id === message.room_id);
  };
  
  const isCurrentUser = (senderId) => {
    return senderId === myuserobj.intra_id;
  };

  const handleFriendClick = (friendIntraId) => {
    setShowMenu(false);
    navigate(`/profile/${friendIntraId}`);
  };
  
  const shouldDisplayMessage = (message) => {
    const isForCurrentRoom = message.room_id === room_id;
    const isDirectMessage = 
      (message.sender === myuserobj.intra_id && message.receiver === user.username) ||
      (message.sender === user.username && message.receiver === myuserobj.intra_id);

    return isForCurrentRoom || isDirectMessage;
  };
 
  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg md:rounded-xl lg:rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b">
        <div className="flex items-center gap-2 md:gap-3">
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg">{userName}</h3>
          </div>
        </div>
        
        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="bg-slate-300 p-1.5 sm:p-2 hover:bg-white rounded-full transition-colors"
            type="button"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 md:w-56 bg-black-500 rounded-lg md:rounded-xl shadow-lg py-1 z-10 border border-gray-100">
              <button
                onClick={handleMenuAction}
                className="w-full px-3 sm:px-4 py-2 text-left text-black hover:bg-green-600 text-sm sm:text-base"
              >
                Invite to game
              </button>
          
              <button
                onClick={() => handleFriendClick(user.username)}
                className="w-full px-3 sm:px-4 py-2 text-left text-black hover:bg-green-600 text-sm sm:text-base"
              >
                Show Profile
              </button>

              <button
                onClick={handleBlock}
                className="w-full px-3 sm:px-4 py-2 text-left text-black hover:bg-green-600 text-sm sm:text-base"
              >
                {!isBlock ? "Block" : "Unblock"}
              </button>
            </div>
          )}
        </div>
      </div>
  
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
        {messages
          .filter(msg => shouldDisplayMessage(msg))
          .map((msg, index) => {
            const isReceived = !isCurrentUser(msg.sender);
            return (
              <div 
                key={index} 
                className={`flex ${isCurrentUser(msg.sender) ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-xl md:rounded-2xl p-2 sm:p-3 relative ${
                    isCurrentUser(msg.sender)
                      ? 'bg-green-500 text-white rounded-br-none' 
                      : 'bg-gray-100 rounded-bl-none'
                  }`}
                  style={{wordBreak: 'break-word'}}
                >
                  {isReceived && (
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      {msg.sender}
                    </div>
                  )}
                  <p className={`text-sm sm:text-base ${isCurrentUser(msg.sender) ? 'text-white' : 'text-gray-800'}`}>
                    {msg.message}
                  </p>
                  <div className={`text-xs mt-1 ${
                    isCurrentUser(msg.sender) ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>
  
      {/* Message Input */}
      <form onSubmit={handleSend} className="p-2 sm:p-3 bg-gray-50 border-t">
        <div className="flex items-center gap-2 bg-white rounded-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 shadow-sm">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-gray-800 bg-transparent focus:outline-none text-sm sm:text-base"
          />
          <button
            type="submit"
            className={`p-1.5 sm:p-2 rounded-full ${
              message.trim() 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-400'
            } transition-colors`}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

// PropTypes for type checking
ChatConversation.propTypes = {
  myuserobj: PropTypes.object.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    avatar: PropTypes.string,
    full_name: PropTypes.string
  }),
  messages: PropTypes.array,
  onSendMessage: PropTypes.func,
  onClose: PropTypes.func,
  onBlock: PropTypes.func
};

export default ChatConversation;
