import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const generatedGameId = () => {
  return Math.random().toString(36).substring(2, 10);
};

const Game = () => {
  const navigate = useNavigate();

  const gameOptions = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4v3a5 5 0 0 0 10 0V4" />
          <path d="M17 4h2a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4" />
          <path d="M7 4H5a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4" />
        </svg>
      ),
      title: "Tournament",
      path: "/game/tournement",
      rules: "Tournament rules: Compete against multiple players in a bracket-style competition. The winner advances to the next round until a champion is crowned."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      title: "Play vs AI",
      path: "/game/IA",
      rules: "AI rules: Play against our intelligent computer opponent. Choose your difficulty level and test your skills against the machine."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        </svg>
      ),
      title: "Play Vs Friend",
      path: "/game/friend",
      rules: "Friend rules: Invite a friend to play with you. Share a link or challenge someone on your friends list for a friendly match."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
          <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
        </svg>
      ),
      title: "1 Vs 1",
      path: "/game/player_vs_player",
      rules: "1v1 rules: Face off against another player in real-time. The first to score the required points wins the match."
    }
  ];

  const handleGameStart = async (path) => {
    if (path.includes('tournement') || path.includes('player_vs_player') || path.includes('IA')) {
      localStorage.removeItem('gameId');
      let gameId = localStorage.getItem('gameId');
      if (!gameId) {
        gameId = generatedGameId();
        localStorage.setItem('gameId', gameId);
      }
      navigate(`${path}/${gameId}`);
      return;
    }

    if (path === "/game/friend") {
      navigate(path);
      return;
    }

    try {
      const gameData = {
        gameType: path.split('/')[2],
        userId: localStorage.getItem('userId')
      };
  
      const response = await axios.post('http://localhost:8001/api/hello/', gameData);
      const { gameId } = response.data;
  
      if (gameId) {
        navigate(`${path}/${gameId}`);
      } else {
        console.error("Game ID not found in response.");
        const fallbackId = generatedGameId();
        navigate(`${path}/${fallbackId}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      const fallbackId = generatedGameId();
      navigate(`${path}/${fallbackId}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen  p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {gameOptions.map((option, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => handleGameStart(option.path)}
              className="w-64 h-64 bg-white flex flex-col items-center justify-center space-y-4 p-6 rounded-xl 
              shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center 
                              justify-center border-2 border-blue-500 hover:border-blue-600">
                {option.icon}
              </div>
              <div className="text-center text-blue-500 font-bold text-lg">
                {option.title}
              </div>
            </button>
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block w-72 bg-white p-4 rounded-lg shadow-lg border border-blue-200 z-20 mt-2 left-1/2 transform -translate-x-1/2">
              <h3 className="font-bold text-blue-600 mb-2">{option.title} Rules</h3>
              <p className="text-sm text-gray-700">{option.rules}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
