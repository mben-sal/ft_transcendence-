import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import logoimage from '../assets/src/Right.svg';
import './two_factor.css';
import api from '../api/axios';


const TwoFactor = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated } = useUser();

  useEffect(() => {
    const state = location.state;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location]);

  const handleChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name=code-${index + 1}]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const clearCode = () => {
    setCode(['', '', '', '', '', '']);
    const firstInput = document.querySelector('input[name=code-0]');
    if (firstInput) firstInput.focus();
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const fullCode = code.join('');
      if (fullCode.length !== 6) {
        setError('Please enter the complete 6-digit code');
        return;
      }

      const response = await api.post('/users/verify-2fa/', {
        code: fullCode,
        temp_token: location.state?.tempToken
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        setIsAuthenticated(true);
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await api.post('/users/resend-2fa/', {
        temp_token: location.state?.tempToken
      });
      
      setError('A new code has been sent to your email');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="login-wrapper">
        <div className="login-form">
          <h2>WE'VE EMAILED YOU A CODE</h2>
          <p>to continue account step, enter the code</p>
          <p>we've sent to: {email}</p>
          
          <div className="form-group">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                name={`code-${index}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="code-input"
                maxLength={1}
                placeholder="-"
                disabled={isLoading}
              />
            ))}
            <button onClick={clearCode} className="clear-button">
              ×
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="verify-button"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="links">
            <Link to="/auth/login" className="back-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
      
      <div className="image">
        <img src={logoimage} alt="Decorative right side image" />
      </div>
    </div>
  );
};

export default TwoFactor;