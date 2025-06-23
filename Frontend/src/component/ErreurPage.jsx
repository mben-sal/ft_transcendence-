import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logoerreur.png';
import erreurPage from '../assets/erreurpage.gif';
import pingpong2 from '../assets/pingpong2.gif';

const ErrorPage = ({ code = 404, message = "Page non trouvée" }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Animated 404 Number */}
      <div className="mb-8">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
          {code}
        </h1>
      </div>

      {/* South Park Style Image */}
      <div className="mb-10 relative">
        <div className="bg-slate-900 p-4 rounded-lg shadow-xl">
          <p className="text-xl font-bold text-gray-800 mb-2">WE ARE DEEPLY SORRY</p>
          <img 
            src={pingpong2}
            alt="404 illustration"
            className="w-64 h-50 object-cover rounded"
          />
        </div>
      </div>

      {/* Fun Message */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Oups ! On dirait que cette page a disparu !
        </h2>
        <p className="text-lg text-gray-300">
          {message}
        </p>
      </div>

      {/* Ping Pong GIF */}
      <div className="mb-8">
        <img 
          src={logo}
          alt="Ping pong animation"
          className="rounded-lg shadow-lg w-10 h-10"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 w-full max-w-xs">
        <button 
          onClick={() => navigate(-1)}
          className="w-full px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-medium transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          ← Retour
        </button>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full px-6 py-3 text-cyan-400 border-2 border-cyan-400 rounded-lg font-medium hover:bg-cyan-400 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;