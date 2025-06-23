import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/users/password-reset/', {
        email: email
      });

      setSuccessMessage('Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.');
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="page">
      <div className="login-wrapper">
        <h2>FORGOT PASSWORD</h2>
        <h6>Enter your email to reset your password</h6>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleForgotPassword}>
          <p>Email</p>
          <input 
            className="shared-input email-input" 
            type="email" 
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <button 
            type="submit" 
            className="sign-in-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Reset password'}
          </button>

          <button 
            type="button"
            onClick={handleBackToLogin} 
            className="sign-in-btn"
            disabled={isLoading}
          >
            🔙 Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}