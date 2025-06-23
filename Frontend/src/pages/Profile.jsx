import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import player_ from '../assets/src/player_.svg';
import { MoreVertical, MessageCircle, UserPlus, UserMinus, Lock } from "lucide-react";
import Friends from '../component/profile/Friends';
import UserInfo from '../component/profile/UserInfo';
import Achievements from '../component/profile/Achievements';
import { useUser } from '../contexts/UserContext';
import cover from '../assets/src/cover_1.jpg';
import { useNavigate } from 'react-router-dom';
// import { API_BASE_URL } from '../config';
import api from '../api/axios';
import { chatService } from '../services/api_chat';

const Profile = () => {
  const { intraId } = useParams(); // Récupérer intraId depuis l'URL
  const { user, updateUser, fetchUserProfile, normalizeAvatarUrl } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(player_);
  const [coverImage] = useState(user?.cover || '');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const profileInputRef = useRef(null);
  const isOwnProfile = !intraId || (user && user.intra_id === intraId);

  // Fonction pour normaliser les URLs d'avatars
  const normalizeAvatar = (avatar) => {
    // Utiliser la fonction du contexte si disponible
    if (normalizeAvatarUrl) return normalizeAvatarUrl(avatar);
    
    // Fallback si la fonction n'est pas disponible dans le contexte
    if (!avatar) return player_;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/media')) return `https://${window.location.host}${avatar}`;
    if (avatar.startsWith('./media')) return `https://${window.location.host}${avatar.substring(1)}`;
    return `https://${window.location.host}/media/${avatar}`;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (isOwnProfile) {
        setProfileData(user);
        setProfileImage(normalizeAvatar(user?.avatar));
        setIsLoading(false);
        return;
      }
  
      try {
        setError(null);
        const response = await api.get(`/users/${intraId}/`);
        
        if (response.status === 200) {
          const data = response.data;
          setProfileData(data);
          setProfileImage(normalizeAvatar(data.avatar));
        } else {
          // Gérer les réponses autres que 200
          throw new Error('Erreur lors du chargement du profil');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setError('Impossible de charger l\'utilisateur.');
        
        // Rediriger vers la page d'accueil après 3 secondes en cas d'erreur
        setTimeout(() => {
          navigate("/", { state: { error: "L'utilisateur n'existe pas ou n'est pas accessible." } });
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadProfileData();
  }, [intraId, user, isOwnProfile, navigate]);
  
  const handleProfileImageChange = async (event) => {
    if (!isOwnProfile) return;
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        const data = response.data;
        // Mise à jour de l'image de profil affichée
        setProfileImage(normalizeAvatar(data.avatarUrl));
        // Récupération du profil complet pour mettre à jour les données utilisateur
        await fetchUserProfile();
      } else {
        throw new Error('Échec du téléchargement de l\'image');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image de profil:', error);
      setError('Échec de la mise à jour de l\'image de profil. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGameInvite = async () => {
    if (isOwnProfile) return;
    try {
      setError(null);
      await api.post('/game/invite/', {
        receiver_id: profileData?.id
      });
      
      setIsMoreOpen(false);
      alert('Invitation à jouer envoyée!');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      setError('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const navigateToChat = async () => {
    if (isOwnProfile || !profileData || !profileData.id) return;
    // const room_name = intraId + "_" + user.intra_id + user.id;
    // console.log("user====>\n",user);
    // console.log("profildata====>\n",profileData);
    const room_name = "room_" + user.id + "_"+ profileData.id;
    // console.log("room====>\n",room_name);
    try {
      // Créer ou récupérer une conversation existante avec cet utilisateur
      const response = await chatService.createConversation(room_name, true, [profileData.id]);
      // const response = await chatService.createPrivateChat(profileData.id);

      // Naviguer vers la page de chat avec cette conversation sélectionnée
      // console.log("conversation_id ==>\n", response);
      navigate(`/chat?room=${response.conversation_id}`);
    } catch (error) {
      // console.error('Erreur lors de la création/récupération du chat:', error);
      alert('Impossible de démarrer la conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md text-center">
          <p>{error}</p>
          <p className="mt-2 text-sm">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" onClick={() => setIsMoreOpen(false)}>
      <div className="max-w-6xl mx-auto bg-[#CBDCEB] rounded-3xl overflow-hidden shadow-xl">
        <div className="relative h-48">
          {/* Image de couverture */}
          <div className="w-full h-full cursor-pointer relative group">
            <div className={`w-full h-full bg-cover bg-center ${coverImage ? '' : 'bg-gray-800'}`}>
              <img
                src={cover}
                alt="Couverture"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Menu d'options - Uniquement pour les profils d'autres utilisateurs */}
          {!isOwnProfile && (
            <div className="absolute top-4 right-4">
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(!isMoreOpen);
                  }}
                  className="p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <MoreVertical className="w-6 h-6 text-white" />
                </button>
                
                {isMoreOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#CBDCEB] rounded-lg shadow-lg py-2 z-50" 
                       onClick={(e) => e.stopPropagation()}>
                    <button className="bg-[#CBDCEB] flex items-center w-full px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={navigateToChat}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image de profil */}
          <div className="absolute -bottom-16 left-6">
            <div 
              className={`relative ${isOwnProfile ? 'cursor-pointer' : ''} group`}
              onClick={() => isOwnProfile && !isUploading && profileInputRef.current?.click()}
            >
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white relative">
                <img
                  src={profileImage}
                  alt="Profil"
                  className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = player_;
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity rounded-2xl flex items-center justify-center">
                  <span className="text-white text-sm">
                    {isUploading ? 'Téléchargement...' : 'Changer la photo'}
                  </span>
                </div>
              )}
              {isOwnProfile && (
                <input
                  ref={profileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleProfileImageChange}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 pb-6">
          <UserInfo userData={profileData} isOwnProfile={isOwnProfile} />
          <Friends userData={profileData} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </div>
  );
};

export default Profile;