import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useUser } from '../../contexts/UserContext';

const PlayWithFriend = () => {
  const { user } = useUser();
  const [playerInfo, setPlayerInfo] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [inviteStatus, setInviteStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeAvatarUrl = (avatar) => {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('./media')) return `https://${window.location.host}t${avatar.substring(1)}`;
    if (avatar.startsWith('/media')) return `https://${window.location.host}${avatar}`;
    return avatar;
  };

  // Status checking with retry logic
  const checkFriendStatus = async (friendName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/search/?q=${encodeURIComponent(friendName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const friendData = response.data.find(user => 
        user.display_name === friendName || user.intra_id === friendName
      );
      
      return friendData?.status || 'offline';
    } catch (error) {
      console.error('Status check failed:', error);
      return 'offline';
    }
  };

  // Refresh statuses periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (friends.length > 0) {
        const updatedFriends = await Promise.all(
          friends.map(async (friend) => ({
            ...friend,
            status: await checkFriendStatus(friend.name)
          }))
        );
        setFriends(updatedFriends);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [friends]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch player profile
        const profileResponse = await api.get('/users/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlayerInfo(profileResponse.data);

        // Fetch and process friends list
        const friendsResponse = await api.get('/users/friends/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const friendsWithStatus = await Promise.all(
          friendsResponse.data.map(async (friendship) => {
            const isSender = friendship.sender_id === user.id;
            const friendName = isSender ? friendship.receiver_name : friendship.sender_name;
            
            return {
              id: isSender ? friendship.receiver_id : friendship.sender_id,
              name: friendName,
              avatar: normalizeAvatarUrl(isSender ? friendship.receiver_avatar : friendship.sender_avatar),
              status: await checkFriendStatus(friendName)
            };
          })
        );

        setFriends(friendsWithStatus);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Failed to load game data");
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Real-time status update on selection
  useEffect(() => {
    if (selectedFriend) {
      const verifyStatus = async () => {
        const currentStatus = await checkFriendStatus(selectedFriend.name);
        if (currentStatus !== selectedFriend.status) {
          setFriends(prev => prev.map(f => 
            f.id === selectedFriend.id ? {...f, status: currentStatus} : f
          ));
        }
      };
      
      verifyStatus();
      const interval = setInterval(verifyStatus, 5000); // Check every 5 seconds for selected friend
      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  const sendGameInvite = async () => {
    if (!selectedFriend) return;

    try {
      // Final verification before sending
      const finalStatus = await checkFriendStatus(selectedFriend.name);
      if (finalStatus !== 'online') {
        setInviteStatus('friend-offline');
        setTimeout(() => setInviteStatus(''), 3000);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await api.post('/game/invite/', {
        receiver_id: selectedFriend.id,
        sender_id: user.id
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.status === 201) {
        setInviteStatus('sent');
        setTimeout(() => setInviteStatus(''), 3000);
      }
    } catch (error) {
      console.error('Invite failed:', error);
      setInviteStatus('failed');
      setTimeout(() => setInviteStatus(''), 3000);
    }
  };

  if (loading) return <div>Loading game data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="play-with-friend-container flex justify-center items-center p-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8">
        {/* Player Info */}
        <div className="player-info flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img
              src={normalizeAvatarUrl(playerInfo?.avatar)}
              alt="Player Avatar"
              className="w-16 h-16 rounded-full mr-6"
            />
            <span className="text-3xl font-semibold text-black">
              {playerInfo?.display_name || 'Unknown Player'}
            </span>
          </div>
        </div>

        {/* Friends List */}
        <div className="friends-list mb-8">
          <h3 className="text-2xl font-semibold text-black mb-6">Select a Friend</h3>
          <select
            onChange={(e) => {
              const friend = friends.find(f => f.id === Number(e.target.value));
              setSelectedFriend(friend);
              setInviteStatus('');
            }}
            className="w-full p-4 border border-gray-300 rounded-md mb-6 text-lg"
          >
            <option value="">Select a friend</option>
            {friends.map(friend => (
              <option 
                key={friend.id} 
                value={friend.id}
                className={friend.status === 'online' ? 'text-green-600' : 'text-red-600'}
              >
                {friend.name} ({friend.status})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Friend Info */}
        {selectedFriend && (
          <div className="selected-friend-info flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img
                src={normalizeAvatarUrl(selectedFriend.avatar)}
                alt="Friend Avatar"
                className="w-16 h-16 rounded-full mr-6"
              />
              <span className="text-xl text-black">{selectedFriend.name}</span>
            </div>
            <span className={`text-xl ${selectedFriend.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
              {selectedFriend.status}
            </span>
          </div>
        )}

        {/* Invite Button */}
        <div className="flex justify-center">
          <button
            onClick={sendGameInvite}
            disabled={!selectedFriend || selectedFriend.status !== 'online'}
            className={`w-full py-4 text-white text-xl rounded-md transition-colors ${
              selectedFriend?.status === 'online' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {inviteStatus === 'sent' && 'Invitation Sent!'}
            {inviteStatus === 'failed' && 'Failed to Send'}
            {inviteStatus === 'friend-offline' && 'Friend Went Offline'}
            {!inviteStatus && (
              selectedFriend?.status === 'online' 
                ? 'Send Game Invite' 
                : selectedFriend 
                  ? 'Friend Offline' 
                  : 'Select a Friend'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayWithFriend;