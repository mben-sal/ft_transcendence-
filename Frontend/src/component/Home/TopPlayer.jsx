import { useState, useEffect } from 'react';
import player from '../../assets/src/player_.svg';
import api from '../../api/axios';

const TopPlayer = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await api.get('/top-players/');
        const formattedData = response.data.map(player => ({
          name: player.name,
          points: `${player.points.toLocaleString()} points`
        }));
        setTopPlayers(formattedData);
      } catch (error) {
        console.error('Error fetching top players:', error);
        // Fallback data with calculated points
        setTopPlayers([
          { name: 'Jon Khan', points: '12,500 points' },  // 125 wins
          { name: 'John benbot', points: '10,100 points' }, // 101 wins
          { name: 'Ely noc', points: '8,100 points' },     // 81 wins
        ]);
      }
      setLoading(false);
    };
    fetchTopPlayers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {topPlayers.map((player, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <p className="font-semibold text-gray-800">{player.name}</p>
              <p className="text-sm text-gray-500">{player.points}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPlayer;