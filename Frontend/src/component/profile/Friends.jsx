import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import player_ from '../../assets/src/player_.svg';
import axios from 'axios';
import { useUser } from '../../contexts/UserContext'; // Utilisation de useUser à la place de useAuth
import api from '../../api/axios';
const Friends = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useUser(); // Obtenir l'utilisateur depuis le contexte
  const token = localStorage.getItem('token'); // Récupérer le token depuis localStorage
  
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  // Fonction pour normaliser les URL d'avatar
  const normalizeAvatarUrl = (avatar) => {
    if (!avatar) return player_;
    if (avatar.startsWith('https')) return avatar;
    if (avatar.startsWith('./media')) return `https://${window.location.host}${avatar.substring(1)}`;
    if (avatar.startsWith('/media')) return `https://${window.location.host}${avatar}`;
    return avatar;
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      // Récupérer la liste des amitiés
      const response = await api.get('users/friends/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Transformer les données en liste d'amis
      const friendsList = response.data.map(friendship => {
        // Déterminer l'ami en fonction de l'utilisateur connecté
        const isSender = friendship.sender_id === user.id;
        
        return isSender 
          ? {
              id: friendship.receiver_id,
              name: friendship.receiver_name,
              image: normalizeAvatarUrl(friendship.receiver_avatar),
              intraId: friendship.receiver_intra_id,
              isOnline: Math.random() > 0.5 // Simulation du statut en ligne
            }
          : {
              id: friendship.sender_id,
              name: friendship.sender_name,
              image: normalizeAvatarUrl(friendship.sender_avatar),
              intraId: friendship.sender_intra_id,
              isOnline: Math.random() > 0.5 // Simulation du statut en ligne
            };
      });
      
      setFriends(friendsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError("Impossible de charger la liste d'amis");
      setLoading(false);
    }
  };

  const handleFriendClick = (friendIntraId) => {
    navigate(`/profile/${friendIntraId}`);
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.intraId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#133E87]">
          {userId ? "Amis" : "Mes Amis"}
        </h1>
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un ami..."
              className="w-full px-4 py-2 rounded-lg bg-slate-300 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#133E87]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 absolute right-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des amis...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      ) : (
        <div className={`overflow-y-auto ${filteredFriends.length > 5 ? 'max-h-96' : 'max-h-96'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFriends.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-8">
                {searchQuery 
                  ? "Aucun ami trouvé avec ce nom" 
                  : userId 
                    ? "Cet utilisateur n'a pas encore d'amis" 
                    : "Vous n'avez pas encore d'amis"}
              </p>
            ) : (
              filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleFriendClick(friend.intraId)}
                  className="bg-white flex w-full gap-2 items-center p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-100"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16">
                      <img
                        src={friend.image || player_}
                        alt={friend.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          console.log("Image error, using default:", friend.image);
                          e.target.onerror = null;
                          e.target.src = player_;
                        }}
                      />
                    </div>
                    {/* <div 
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white 
                      ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    /> */}
                  </div>
                  <div className="flex flex-col items-start justify-start min-w-0">
                    <span className="font-medium text-gray-900 truncate w-full">{friend.name}</span>
                    <span className="text-sm text-start text-gray-500 truncate w-full">
                      @{friend.intraId}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;