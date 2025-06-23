import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../contexts/UserContext'; 
import api from '../../api/axios';
// Utilisation de useUser à la place de useAuth

const FriendRequests = ({ onUpdate }) => {
  const { user } = useUser(); // Obtenir l'utilisateur depuis le contexte
  const token = localStorage.getItem('token'); // Récupérer le token depuis localStorage
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Récupérer les demandes reçues
      const pendingResponse = await api.get('/users/friends/requests/pending/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Récupérer les demandes envoyées
      const sentResponse = await api.get('/users/friends/requests/sent/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPendingRequests(pendingResponse.data);
      setSentRequests(sentResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes d\'ami:', err);
      setError('Impossible de charger les demandes d\'ami');
      setLoading(false);
    }
  };
  
  const handleAction = async (friendshipId, action) => {
    try {
      await api.post(
        `/users/friends/requests/${friendshipId}/`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Rafraîchir les listes après l'action
      fetchRequests();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(`Erreur lors de l'action ${action}:`, err);
      setError(err.response?.data?.error || `Erreur lors de l'action ${action}`);
    }
  };
  
  // Rendu pour les états de chargement et d'erreur
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 border-b border-gray-200">
        <div className="flex">
          <button 
            className={`px-4 py-2 ${activeTab === 'received' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('received')}
          >
            Invitations reçues ({pendingRequests.length})
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'sent' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('sent')}
          >
            Invitations envoyées ({sentRequests.length})
          </button>
        </div>
      </div>
      
      {activeTab === 'received' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Vous n'avez pas de demandes d'amis en attente.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <img 
                      src={request.sender_avatar} 
                      alt={request.sender_name} 
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{request.sender_name}</div>
                      <div className="text-sm text-gray-500">@{request.sender_intra_id}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleAction(request.id, 'accept')}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-md"
                    >
                      Accepter
                    </button>
                    <button 
                      onClick={() => handleAction(request.id, 'reject')}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'sent' && (
        <div>
          {sentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Vous n'avez pas envoyé de demandes d'amis.
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <img 
                      src={request.receiver_avatar} 
                      alt={request.receiver_name} 
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{request.receiver_name}</div>
                      <div className="text-sm text-gray-500">@{request.receiver_intra_id}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleAction(request.id, 'cancel')}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded-md"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;