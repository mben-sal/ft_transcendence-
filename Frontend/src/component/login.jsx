import api from '../api/axios'; 
import logo42 from '../assets/src/42_.svg'; 
import './login.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoimage from '../assets/src/Right.svg';
import { AUTH_CONFIG } from '../config';
import signup from '../assets/src/signup.png';
import { useUser } from '../contexts/UserContext';

export default function Login() {
    const navigate = useNavigate();
    const { setIsAuthenticated } = useUser();
    const [formData, setFormData] = useState({
		loginName: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.loginName) {
            newErrors.loginName = 'Login name is required!';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required!';
        }
        else if (formData.password.length < 8) {
            newErrors.password = 'Password is too short!';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
        const response = await api.post('/users/login/', {
            login_name: formData.loginName, 
            password: formData.password
        });

        if (response.data.requires_2fa) {
            // Rediriger vers la page 2FA avec les informations nécessaires
            navigate('/auth/two-factor', {
                state: {
                    email: formData.loginName,
                    tempToken: response.data.temp_token
                }
            });
        } else {
            // Login normal sans 2FA
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            setIsAuthenticated(true);
            navigate('/');
        }
    } catch (error) {
        setErrors({ 
            submit: error.response?.data?.message || 'Invalid credentials'
        });
    } finally {
        setIsLoading(false);
    }
};
    const handle42Login = (type = 'signin') => {
        if (!AUTH_CONFIG.CLIENT_ID || !AUTH_CONFIG.REDIRECT_URI) {
            setErrors({ submit: 'OAuth configuration is missing.' });
            return;
        }
    
        const params = new URLSearchParams({
            client_id: AUTH_CONFIG.CLIENT_ID,
            redirect_uri: AUTH_CONFIG.REDIRECT_URI,
            response_type: 'code',
            scope: 'public',
            state: type
        });
    
        console.log('Redirect URI:', AUTH_CONFIG.REDIRECT_URI);
        const authUrl = `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
        window.location.href = authUrl;
    };

    // Votre JSX reste exactement le même
    return (
	<div className="page overflow-auto"> {/* Ajout de overflow-auto */}
        <div className="page">
            <div className='login-wrapper'>
                <h2>- PingPong -</h2>
                <br/><br/>
                <h6>Welcome ! enter your details</h6>
                <form onSubmit={handleSubmit} className="w-full max-w-[30rem]">
                <br/>
                    <p>Login</p>
                    <input 
                        id='email'
                        name='loginName'
                        className={`shared-input email-input ${errors.email ? 'error' : ''}`}
                        type="text" 
                        placeholder="Enter your login name"
                        value={formData.loginName}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={errors.loginName ? 'true' : 'false'}
                        required
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                    
                    <p>Password</p>
                    <input
                        id='password'
                        name='password'
                        className={`shared-input password-input ${errors.password ? 'error' : ''}`}
                        type="password" 
                        placeholder="********"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={errors.password ? 'true' : 'false'}
                        required
                    />
                    {errors.password && <span className="error">{errors.password}</span>}

                    <div className="remember-forgot">
                        <Link to="/auth/forgot-password">Forgot password?</Link>
                    </div>

                    {errors.submit && <span className="error">{errors.submit}</span>}
                    
                    <button 
                        type="submit" 
                        className="sign-in-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                    
                    <h5>OR</h5>
                    
                    <button 
                        type="button" 
                        className="ft-sign-in-btn"
                        onClick={() => handle42Login('signin')}
                        disabled={isLoading}
                    >
                        <img src={logo42} alt="42 logo" />
                        Sign in 
                    </button>

                    <hr className="bar" />

                    <div className="sign-up-prompt">
                        <span>Don&apos;t have an account? </span>
                        <Link 
                            to="/auth/signup"
                            className="ft-sign-in-btn flex items-center gap-2"
                        >
                            <img src={signup} alt="Sign up icon" className="h-8" />
                            <span>Sign up</span>
                        </Link>
                    </div>
                </form>
            </div>
            <div className="image">
                <img src={logoimage} alt="Decorative right side image" />
            </div>
        </div>
	</div>
    );
}