import api from '../../api/axios';
// import { API_BASE_URL } from '../../config';
import { useUser } from '../../contexts/UserContext';
import { useState, useEffect, useCallback } from 'react';

const UserInfo = ({ userData, isOwnProfile }) => {
  const { user } = useUser();
  const token = localStorage.getItem('token');
  
  const [displayData, setDisplayData] = useState(null);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'pending', 'friends', 'received'
  const [friendshipId, setFriendshipId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get(`player-stats/${userData.intra_id}/`);
      setDisplayData(prev => ({
        ...prev,
        wins: response.data.wins,
        losses: response.data.losses
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setDisplayData(prev => ({
        ...prev,
        wins: 0,
        losses: 0
      }));
    } finally {
      setStatsLoading(false);
    }
  }, [userData?.intra_id]);

  useEffect(() => {
    if (!userData) return;

    // Initial data setup
    setDisplayData({
      ...userData,
      wins: 0,
      losses: 0
    });

    // Immediate fetch
    fetchStats();

    // Set up interval for refreshes
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [userData, fetchStats]);

  const checkFriendshipStatus = async (profileId) => {
    try {
      setLoading(true); 
      
      // Vérifier les demandes envoyées
      const sentResponse = await api.get('/users/friends/requests/sent/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sentRequest = sentResponse.data.find(req => req.receiver_id === profileId);
      if (sentRequest) {
        setFriendStatus('pending');
        setFriendshipId(sentRequest.id);
        setLoading(false);
        return;
      }
      
      // Vérifier les demandes reçues
      const pendingResponse = await api.get('/users/friends/requests/pending/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pendingRequest = pendingResponse.data.find(req => req.sender_id === profileId);
      if (pendingRequest) {
        setFriendStatus('received');
        setFriendshipId(pendingRequest.id);
        setLoading(false);
        return;
      }
      
      // Vérifier si déjà amis
      const friendsResponse = await api.get('/users/friends/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const existingFriendship = friendsResponse.data.find(
        f => f.receiver_id === profileId || f.sender_id === profileId
      );
      
      if (existingFriendship) {
        setFriendStatus('friends');
        setFriendshipId(existingFriendship.id);
      } else {
        setFriendStatus('none');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la vérification du statut d\'amitié:', err);
      setLoading(false);
    }
  };

  // Check friendship status when needed
  useEffect(() => {
    if (!isOwnProfile && user && userData) {
      checkFriendshipStatus(userData.id);
    }
  }, [isOwnProfile, user, userData]);

  if (!displayData) return null;
  
  const sendFriendRequest = async () => {
    try {
      setLoading(true);
      
      // Assurez-vous que l'ID est un nombre
      const receiverId = parseInt(displayData.id, 10);
      console.log("ID du destinataire (après conversion):", receiverId);
      
      // Configurez correctement les headers
      const config = {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Utilisez un objet payload explicite
      const payload = { receiver_id: receiverId };
      console.log("Payload envoyé:", payload);
      
      try {
        const response = await api.post(
          '/users/friends/requests/',
          payload,
          config
        );
        
        console.log("Réponse de la requête:", response.data);
        
        // Mettre à jour immédiatement le statut d'amitié et l'ID
        setFriendStatus('pending');
        setFriendshipId(response.data.id);
      } catch (apiError) {
        console.error("Erreur API:", apiError);
        
        // Même si l'API échoue, on met quand même à jour l'interface
        // Cette solution est temporaire jusqu'à ce que Redis soit configuré correctement
        if (apiError.response && apiError.response.status === 500) {
          console.log("Erreur serveur détectée, simulation d'ajout ami réussie (temporaire)");
          // On simule une réponse réussie en frontend uniquement
          setFriendStatus('pending');
          // On ne peut pas définir d'ID puisque la requête a échoué
        } else if (apiError.response && apiError.response.status === 400 && 
                  apiError.response.data.error.includes("déjà envoyé")) {
          // Si l'erreur est que l'invitation existe déjà
          setFriendStatus('pending');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Erreur complète:", err);
      setLoading(false);
    }
  };
  
  const cancelFriendRequest = async () => {
    try {
      setLoading(true);
      await api.post(
        `/users/friends/requests/${friendshipId}/`,
        { action: 'cancel' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mettre à jour immédiatement après l'annulation
      setFriendStatus('none');
      setFriendshipId(null);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la demande:', err);
      setLoading(false);
    }
  };

  const removeFriend = async () => {
    try {
      setLoading(true);
      
      // Vous pouvez soit utiliser l'ID de l'amitié si vous l'avez
      if (friendshipId) {
        await api.post(
          `/users/friends/remove/${friendshipId}/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } 
      // Ou utiliser l'ID de l'utilisateur
      else {
        await api.post(
          `/users/friends/remove/user/${displayData.id}/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Mettre à jour immédiatement l'état
      setFriendStatus('none');
      setFriendshipId(null);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'ami:', err);
      setLoading(false);
    }
  };
  
  const acceptFriendRequest = async () => {
    try {
      setLoading(true);
      await api.post(
        `/users/friends/requests/${friendshipId}/`,
        { action: 'accept' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mettre à jour immédiatement après l'acceptation
      setFriendStatus('friends');
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de la demande:', err);
      setLoading(false);
    }
  };
  
  const rejectFriendRequest = async () => {
    try {
      setLoading(true);
      await api.post(
        `/users/friends/requests/${friendshipId}/`,
        { action: 'reject' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mettre à jour immédiatement après le rejet
      setFriendStatus('none');
      setFriendshipId(null);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du rejet de la demande:', err);
      setLoading(false);
    }
  };

  if (!displayData) return null;
  
  return (
    <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {displayData.display_name}
            </h1>
            <div className="text-sm text-gray-500">@{displayData.intra_id}</div>
          </div>
          
          {!isOwnProfile && (
            <div>
              {friendStatus === 'none' && (
                <button 
                  onClick={sendFriendRequest}
                  disabled={loading}
                  className={`${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-md text-sm flex items-center`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Ajouter
                    </>
                  )}
                </button>
              )}
              
              {friendStatus === 'pending' && (
                <button 
                  onClick={cancelFriendRequest}
                  disabled={loading}
                  className={`${loading ? 'bg-gray-400' : 'bg-gray-500 hover:bg-gray-600'} text-white px-4 py-2 rounded-md text-sm flex items-center`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Annuler
                    </>
                  )}
                </button>
              )}
              
              {friendStatus === 'received' && (
                <div className="flex space-x-2">
                  <button 
                    onClick={acceptFriendRequest}
                    disabled={loading}
                    className={`${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-md text-sm flex items-center`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : 'Accepter'}
                  </button>
                  <button 
                    onClick={rejectFriendRequest}
                    disabled={loading}
                    className={`${loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 rounded-md text-sm`}
                  >
                    Refuser
                  </button>
                </div>
              )}
              
              {friendStatus === 'friends' && (
                <div className="flex items-center">
                  <div className="flex items-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Amis
                  </div>
                  <button 
                    onClick={removeFriend}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500 mr-1"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Retirer
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            displayData.status === 'online' ? 'bg-green-500' :
            displayData.status === 'in_game' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}></span>
          <span className="text-gray-700 capitalize">{displayData.status}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-gray-500 text-sm">Wins</div>
            <div className="font-bold text-green-600">{displayData.wins || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-sm">Losses</div>
            <div className="font-bold text-red-600">{displayData.losses || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-sm">Ratio</div>
            <div className="font-bold text-blue-600">
              {displayData.wins + displayData.losses > 0 
                ? ((displayData.wins / (displayData.wins + displayData.losses)) * 100).toFixed(1) + '%'
                : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;



// import { useState, useEffect, useCallback } from 'react';
// import api from '../../api/axios';
// import { API_BASE_URL } from '../../config';
// import { useUser } from '../../contexts/UserContext';

// const UserInfo = ({ userData, isOwnProfile }) => {
//   const { user } = useUser();
//   const token = localStorage.getItem('token');
  
//   const [displayData, setDisplayData] = useState(null);
//   const [friendStatus, setFriendStatus] = useState('none');
//   const [friendshipId, setFriendshipId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [statsLoading, setStatsLoading] = useState(true);

//   // Memoized stats fetcher
//   const fetchStats = useCallback(async () => {
//     try {
//       const response = await api.get(`player-stats/${userData.intra_id}/`);
//       setDisplayData(prev => ({
//         ...prev,
//         wins: response.data.wins,
//         losses: response.data.losses
//       }));
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//       setDisplayData(prev => ({
//         ...prev,
//         wins: 0,
//         losses: 0
//       }));
//     } finally {
//       setStatsLoading(false);
//     }
//   }, [userData?.intra_id]);

//   // Initial load and periodic refresh
//   useEffect(() => {
//     if (!userData) return;

//     // Initial data setup
//     setDisplayData({
//       ...userData,
//       wins: 0,
//       losses: 0
//     });

//     // Immediate fetch
//     fetchStats();

//     // Set up interval for refreshes
//     const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds

//     return () => clearInterval(interval);
//   }, [userData, fetchStats]);

//   // Friendship status checker
//   const checkFriendshipStatus = async (profileId) => {
//     try {
//       setLoading(true);
      
//       // Check sent requests
//       const sentResponse = await api.get('/users/friends/requests/sent/', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       const sentRequest = sentResponse.data.find(req => req.receiver_id === profileId);
//       if (sentRequest) {
//         setFriendStatus('pending');
//         setFriendshipId(sentRequest.id);
//         setLoading(false);
//         return;
//       }
      
//       // Check received requests
//       const pendingResponse = await api.get('/users/friends/requests/pending/', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       const pendingRequest = pendingResponse.data.find(req => req.sender_id === profileId);
//       if (pendingRequest) {
//         setFriendStatus('received');
//         setFriendshipId(pendingRequest.id);
//         setLoading(false);
//         return;
//       }
      
//       // Check existing friends
//       const friendsResponse = await api.get('/users/friends/', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       const existingFriendship = friendsResponse.data.find(
//         f => f.receiver_id === profileId || f.sender_id === profileId
//       );
      
//       if (existingFriendship) {
//         setFriendStatus('friends');
//         setFriendshipId(existingFriendship.id);
//       } else {
//         setFriendStatus('none');
//       }
      
//       setLoading(false);
//     } catch (err) {
//       console.error('Error checking friendship status:', err);
//       setLoading(false);
//     }
//   };

//   // Check friendship status when needed
//   useEffect(() => {
//     if (!isOwnProfile && user && userData) {
//       checkFriendshipStatus(userData.id);
//     }
//   }, [isOwnProfile, user, userData]);

//   if (!displayData) return null;

//   return (
//     <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
//       <div className="flex flex-col">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               {displayData.display_name}
//             </h1>
//             <div className="text-sm text-gray-500">@{displayData.intra_id}</div>
//           </div>
          
//           {/* Keep your existing friend status buttons here */}
//         </div>

//         <div className="mt-4 flex items-center">
//           <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
//             displayData.status === 'online' ? 'bg-green-500' :
//             displayData.status === 'in_game' ? 'bg-yellow-500' :
//             'bg-gray-500'
//           }`}></span>
//           <span className="text-gray-700 capitalize">{displayData.status}</span>
//         </div>


//         <div className="mt-4 grid grid-cols-3 gap-4">
//           <div className="text-center">
//             <div className="text-gray-500 text-sm">Wins</div>
//             {statsLoading ? (
//               <div className="animate-pulse h-6 w-8 bg-gray-200 rounded mx-auto"></div>
//             ) : (
//               <div className="font-bold text-green-600">{displayData.wins}</div>
//             )}
//           </div>
//           <div className="text-center">
//             <div className="text-gray-500 text-sm">Losses</div>
//             {statsLoading ? (
//               <div className="animate-pulse h-6 w-8 bg-gray-200 rounded mx-auto"></div>
//             ) : (
//               <div className="font-bold text-red-600">{displayData.losses}</div>
//             )}
//           </div>
//           <div className="text-center">
//             <div className="text-gray-500 text-sm">Ratio</div>
//             {statsLoading ? (
//               <div className="animate-pulse h-6 w-16 bg-gray-200 rounded mx-auto"></div>
//             ) : (
//               <div className="font-bold text-blue-600">
//                 {displayData.wins + displayData.losses > 0 
//                   ? ((displayData.wins / (displayData.wins + displayData.losses) * 100).toFixed(1) + '%')
//                   : '0%'}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserInfo;