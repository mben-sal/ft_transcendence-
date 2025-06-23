import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import pingpong from '../assets/src/pingpong.svg';
import LineChart from '../component/Home/LineChart';
import PieChart from '../component/Home/PieChart';
import Hello from '../component/Home/Hello';
import TopPlayer from '../component/Home/TopPlayer';

const PongDashboard = () => {
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState(location.state?.error || null);
  
  // Masquer le message après 5 secondes
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 2000);
  
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  const matchData = [
    { day: 25, matches: 4 },
    { day: 26, matches: 5 },
    { day: 27, matches: 7 },
    { day: 28, matches: 8 },
    { day: 29, matches: 7 },
    { day: 30, matches: 6 },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      {/* Message d'erreur */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg relative">
          <strong className="font-bold">Erreur ! </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        {/* Left Section */}
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          {/* Match Stats Card */}
          <div className="bg-gray rounded-xl p-3 md:p-4 lg:p-6 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">
              Your Match
            </h2>              
            <div className="w-full max-w-md mx-auto">
              <PieChart />
            </div>
          </div>

          {/* Hello Card */}
          <div className="bg-gray rounded-xl p-3 md:p-4 lg:p-5 shadow-lg">
            <Hello />
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          {/* Top Players Card */}
          <div className="bg-gray rounded-xl p-4 md:p-6 lg:p-10 shadow-lg">
            <div className="flex justify-between items-center mb-4 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-blue-900">
                TOP 3 PLAYERS
              </h3>
              <img 
                src={pingpong} 
                alt="avatar" 
                className="w-8 h-8 md:w-12 md:h-12" 
              />
            </div>
            
            <div className="space-y-4 md:space-y-8">
              <TopPlayer />
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-gray rounded-xl p-4 md:p-6 lg:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 md:mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-2 sm:mb-0">
                Score
              </h3>
              <span className="text-red-500 text-xs md:text-sm">
                ↓ 2.2% vs last week
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-8">
              from 1-31 Dec, 2025
            </p>
            
            <div className="h-48 md:h-56 lg:h-64">
              <LineChart chartData={matchData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PongDashboard;