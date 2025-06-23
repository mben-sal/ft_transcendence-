import { useUser } from '../../contexts/UserContext';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchNavbar = () => {
  const { user, normalizeAvatarUrl } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`https://${window.location.host}/api/users/search/?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fonction pour normaliser les URL d'avatar
  const normalizeAvatar = (avatar) => {
    // Utiliser la fonction du contexte si disponible
    if (normalizeAvatarUrl) return normalizeAvatarUrl(avatar);
    
    if (!avatar) return `https://${window.location.host}/media/avatars/defaultavatar.png`;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('./media')) return `https://${window.location.host}${avatar.substring(1)}`;
    if (avatar.startsWith('/media')) return `https://${window.location.host}${avatar}`;
    return `https://${window.location.host}/media/${avatar}`;
  };

  const handleUserClick = (result) => {
    navigate(`/profile/${result.intra_id}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher des utilisateurs..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/80 border border-gray-300 focus:outline-none focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => handleUserClick(result)}
            >
              <img
                src={normalizeAvatar(result.avatar)}
                alt={result.display_name}
                className="w-8 h-8 rounded-full mr-3 bg-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://${window.location.host}/media/avatars/defaultavatar.png`;
                }}
              />
              <div>
                <div className="font-medium">{result.display_name}</div>
                <div className="text-sm text-gray-500">{result.intra_id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchNavbar;