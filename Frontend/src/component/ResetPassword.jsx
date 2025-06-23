import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant');
      setTimeout(() => navigate('/auth/login'), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/users/password-reset-confirm/', {
        token: token,
        new_password: formData.password
      });

      setSuccessMessage('Mot de passe réinitialisé avec succès!');
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);

    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">RESET PASSWORD</h2>
          <h6 className="text-gray-600">Enter your new password</h6>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">New Password</p>
            <input
              type="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Confirm Password</p>
            <input
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Réinitialisation...' : 'Reset password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="w-full bg-white text-blue-600 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              disabled={isLoading}
            >
              🔙 Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}