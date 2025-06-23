import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import AuthLayout from './layout/AuthLayout';
import DashboardLayout from './layout/DashboardLayout'; 
import Login from './component/login';
import Home from './pages/Home';
import Game from './pages/Game';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import TwoFactor from './component/two_factor';
import ForgotPassword from './component/forgotPassword';
import Profile from './pages/Profile';
import OAuthCallback from './layout/OAuthCallback';
import { useUser } from './contexts/UserContext';
import SignUp from './component/SignUp';
import ResetPassword from './component/ResetPassword';
import ErrorPage from './component/ErreurPage'; // Add this import
import PlayWithFriend from './component/game/PlayWithFriend'; 
import GamePage from './component/game/GamePage'
import Tournament from './component/Tournament/Tournament';
import PongGame from './component/vsIA/vsia';

import OneVsOneMatch from './component/1VS1/ownVsown';
// Protected Routes component remains the same
const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useUser();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Chargement...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return <DashboardLayout />;
};

const App = () => {
  return (
    <UserProvider>
      <div className='w-full min-h-dvh overflow-auto'>
        <Router>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/two-factor" element={<TwoFactor />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
            </Route>

            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Home />} />
              <Route path="/game" element={<Game />} />
              <Route path="/game/friend" element={<PlayWithFriend />} />
              <Route path="/game/:gameId" element={<GamePage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:intraId" element={<Profile />} />
              <Route path="/game/tournement/:gameId" element={<Tournament />} />
              <Route path="/game/player_Vs_player/:gameId" element={<OneVsOneMatch />} />
              <Route path="/game/IA/:gameId" element={<PongGame />} />
            </Route>

            {/* Add Error Routes */}
            <Route path="/404" element={<ErrorPage code={404} message="Page non trouvée" />} />
            <Route path="/403" element={<ErrorPage code={403} message="Accès refusé" />} />
            <Route path="/500" element={<ErrorPage code={500} message="Erreur serveur" />} />
            
            {/* Catch all route - will show 404 */}
            <Route path="*" element={<ErrorPage code={404} message="Page non trouvée" />} />
          </Routes>
        </Router>
      </div>
    </UserProvider>
  );
};

export default App;