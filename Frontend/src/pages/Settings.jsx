import { Pencil, Shield, Camera, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import Player_ from '../assets/src/player_.svg';
import ConfirmationModal from '../component/settings/confirmationModel';
import ActionButtons from '../component/settings/ActionButtons';
import api from '../api/axios';

const ProfileSettings = () => {
  const { user, fetchUserProfile, normalizeAvatarUrl } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState(null);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Fonction pour normaliser l'URL de l'avatar si elle n'est pas fournie par le contexte
  const normalizeAvatar = (avatar) => {
    if (normalizeAvatarUrl) return normalizeAvatarUrl(avatar);
    
    if (!avatar) return Player_;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/media')) return `https://${window.location.host}${avatar}`;
    if (avatar.startsWith('./media')) return `https://${window.location.host}${avatar.substring(1)}`;
    return `https://${window.location.host}/media/${avatar}`;
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setTwoFactorEnabled(user.two_factor_enabled || false);
    }
  }, [user]);

  const validatePasswords = () => {
    if (newPassword && !currentPassword) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return false;
    }
    if (newPassword && newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };
  
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('avatar', file);
  
    setUploadLoading(true);
    setError('');
    
    try {
      // Utiliser l'API de profil pour l'upload
      const response = await api.post('/users/avatar/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Actualiser le profil pour récupérer la nouvelle URL d'avatar
      await fetchUserProfile();
      
      console.log('Avatar mis à jour avec succès:', response.data);
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      setError('Erreur lors de l\'upload de la photo: ' + 
              (error.response?.data?.error || error.message));
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleDeletePhoto = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }
  
    try {
      // Utiliser l'API de profil pour la suppression
      await api.delete('/users/avatar/');
      
      // Actualiser le profil
      await fetchUserProfile();
      console.log('Avatar supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      setError('Erreur lors de la suppression de la photo: ' + 
              (error.response?.data?.error || error.message));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (newPassword) {
        // Demande de changement de mot de passe
        if (!validatePasswords()) {
          setLoading(false);
          return;
        }
  
        const response = await api.post(
          '/users/request-password-change/',
          {
            old_password: currentPassword,
            new_password: newPassword
          }
        );
  
        if (response.data.status === 'success') {
          setConfirmationType('password');
          setShowConfirmation(true);
        }
      } else {
        // Demande de mise à jour de profil
        const response = await api.post(
          '/users/request-change/',
          {
            first_name: firstName,
            last_name: lastName,
            two_factor_enabled: twoFactorEnabled
          }
        );
        
        if (response.data.message) {
          setConfirmationType('profile');
          setShowConfirmation(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error.response || error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Erreur lors de la sauvegarde';
      
      if (newPassword) {
        setPasswordError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmation = async (code) => {
    try {
      let response;
  
      if (confirmationType === 'password') {
        response = await api.post(
          '/users/confirm-password-change/',
          { confirmation_code: code }
        );
  
        if (response.data.status === 'success') {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
          setShowConfirmation(false);
          
          // Déconnexion après changement de mot de passe
          alert('Mot de passe changé avec succès. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth/login';
        }
      } else {
        // Confirmation de changement de profil
        response = await api.post(
          '/users/confirm-profile-change/',
          { confirmation_code: code }
        );
  
        if (response.data && response.data.message) {
          setShowConfirmation(false);
          await fetchUserProfile();
        }
      }
    } catch (error) {
      console.error('Erreur de confirmation:', error.response || error);
      throw new Error(error.response?.data?.error || 'Code de confirmation invalide');
    }
  };

  if (!user) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Obtenir l'URL normalisée de l'avatar
  const avatarUrl = normalizeAvatar(user.avatar);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-semibold text-center mb-4">Paramètres du Profil</h1>
          <div className="flex items-center gap-4 justify-center">
            <div className="relative group">
              <img 
                src={avatarUrl}
                onError={(e) => {e.target.src = Player_}} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handlePhotoClick}
                  disabled={uploadLoading}
                  className="absolute bg-black/50 rounded-full p-1"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {user?.avatar && user.avatar !== '/media/avatars/defaultavatar.png' && (
                  <button 
                    onClick={handleDeletePhoto}
                    disabled={uploadLoading}
                    className="absolute bg-red-500/50 rounded-full p-1 -right-2 -top-2"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/png"
                className="hidden"
                disabled={uploadLoading}
              />
              {uploadLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <span className="text-lg font-medium">
              {uploadLoading ? 'Chargement...' : `${user.first_name || ''} ${user.last_name || ''}`}
            </span>
          </div>
        </div>

        {/* Affichage des erreurs générales */}
        {error && (
          <div className="m-6 bg-red-50 text-red-600 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Contenu principal en deux colonnes */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche: Profil et Two Factor */}
            <div className="space-y-8">
              {/* Section de modification du profil */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Pencil className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-medium">Modifier le Profil</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-neutral-950">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-950">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-950"
                    />
                  </div>
                </div>
              </div>

              {/* Section d'authentification à deux facteurs */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-lg font-medium">Authentification à Deux Facteurs</h2>
                      <p className="text-sm text-gray-600">
                        {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={twoFactorEnabled}
                      onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 text-neutral-950">
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Colonne droite: Gestion du mot de passe */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-medium">Changer de Mot de Passe</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-neutral-950">Mot de Passe Actuel</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-950"
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-neutral-950">Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-950"
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-neutral-950">Confirmer le Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-950"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
            </div>
          </div>
          <ActionButtons 
            onSave={handleSave}
            loading={loading}
          />
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmation}
        type={confirmationType}
      />
    </div>
  );
};

export default ProfileSettings;