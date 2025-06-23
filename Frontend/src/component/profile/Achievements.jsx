import { useUser } from '../../contexts/UserContext';
import { useEffect, useState } from 'react';

const Achievements = () => {
const { user } = useUser();
const [achievements, setAchievements] = useState([]);

useEffect(() => {
  if (user) {
    const userAchievements = [
      { id: 1, name: `${user.wins} Wins`, icon: "🏆" },
      { id: 2, name: `${user.losses} Losses`, icon: "💔" },
      { id: 3, name: `${user.draws || 0} Equality`, icon: "🤝" }  // Adding draws with fallback to 0
    ];
    
    // Additional achievements based on performance
    if (user.wins > 10) {
      userAchievements.push({ id: 4, name: "Pro Player", icon: "👑" });
    }
    if (user.wins > user.losses) {
      userAchievements.push({ id: 5, name: "Positive Ratio", icon: "📈" });
    }
    
    setAchievements(userAchievements);
  }
}, [user]);

if (!user) return null;

return (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    {achievements.map(achievement => (
      <div key={achievement.id} className="bg-gray-700 p-4 rounded-xl flex items-center space-x-3 hover:bg-gray-600 transition-colors">
        <span className="text-2xl">{achievement.icon}</span>
        <span className="text-white">{achievement.name}</span>
      </div>
    ))}
  </div>
);
};

export default Achievements;