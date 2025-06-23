import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import api from '../api/axios';


export default function SignUp() {
    const navigate = useNavigate();
    const { setIsAuthenticated } = useUser();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        intraId: '',
        displayName: '',
        loginName: '',
        two_factor_enabled: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.loginName.trim()) {
            newErrors.loginName = 'Login name is required';
        } else if (formData.loginName.length < 3) {
			newErrors.loginName = 'Login name must be at least 3 characters';
		}

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		
		// Effacer l'erreur spécifique à ce champ
		setErrors(prev => {
			const newErrors = { ...prev };
			
			// Supprimer l'erreur spécifique
			delete newErrors[name];
			
			// Si le champ modifié est "loginName" et qu'il y a une erreur de soumission qui concerne le login,
			// supprimer également l'erreur de soumission
			if (name === 'loginName' && prev.submit && prev.submit.toLowerCase().includes('nom d\'utilisateur')) {
				delete newErrors.submit;
			}
			
			return newErrors;
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;
	
		const payload = {
			email: formData.email,
			password: formData.password,
			first_name: formData.firstName,
			last_name: formData.lastName,
			login_name: formData.loginName
		};
		
		setIsLoading(true);
		setErrors({}); // Réinitialiser toutes les erreurs
	
		try {
			const response = await api.post('/users/signup/', payload);
			
			localStorage.setItem('token', response.data.token);
			localStorage.setItem('refresh_token', response.data.refresh_token);
			setIsAuthenticated(true);
			navigate('/');
		} catch (error) {
			console.error("Signup error:", error.response?.data);
			
			// Gestion améliorée des erreurs du backend
			if (error.response?.data) {
				const backendErrors = error.response.data;
				const fieldErrors = {};
				
				// Vérifier si la structure contient "errors"
				if (backendErrors.errors) {
					// Gestion spécifique pour le login
					if (backendErrors.errors.login_name) {
						const loginError = Array.isArray(backendErrors.errors.login_name) 
							? backendErrors.errors.login_name[0] 
							: backendErrors.errors.login_name;
						
						fieldErrors.loginName = loginError;
						fieldErrors.submit = loginError;
					}
					
					if (backendErrors.errors.email) {
						fieldErrors.email = Array.isArray(backendErrors.errors.email) 
							? backendErrors.errors.email[0] 
							: backendErrors.errors.email;
					}
					
					if (backendErrors.errors.password) {
						fieldErrors.password = Array.isArray(backendErrors.errors.password) 
							? backendErrors.errors.password[0] 
							: backendErrors.errors.password;
					}
				} else {
					// Format d'erreur alternatif
					if (backendErrors.login_name) {
						fieldErrors.loginName = Array.isArray(backendErrors.login_name) 
							? backendErrors.login_name[0] 
							: backendErrors.login_name;
					}
					
					if (backendErrors.email) {
						fieldErrors.email = Array.isArray(backendErrors.email) 
							? backendErrors.email[0] 
							: backendErrors.email;
					}
					
					if (backendErrors.password) {
						fieldErrors.password = Array.isArray(backendErrors.password) 
							? backendErrors.password[0] 
							: backendErrors.password;
					}
				}
				
				// Si aucune erreur spécifique n'est trouvée mais qu'il y a un message général
				if (Object.keys(fieldErrors).length === 0 && backendErrors.message) {
					fieldErrors.submit = backendErrors.message;
				}
				
				if (Object.keys(fieldErrors).length === 0) {
					fieldErrors.submit = "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.";
				}
				
				setErrors(fieldErrors);
			} else {
				// En cas d'erreur réseau ou autre
				setErrors({ submit: "Erreur de connexion au serveur. Veuillez réessayer." });
			}
		} finally {
			setIsLoading(false); // Toujours réinitialiser isLoading
		}
	};

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-2">CREATE ACCOUNT</h2>
                <p className="text-center text-gray-600 mb-6">Please enter your details to create an account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
                            />
                            {errors.firstName && (
                                <span className="text-red-500 text-sm">{errors.firstName}</span>
                            )}
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
                            />
                            {errors.lastName && (
                                <span className="text-red-500 text-sm">{errors.lastName}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
                        />
                        {errors.email && (
                            <span className="text-red-500 text-sm">{errors.email}</span>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700">Login Name</label>
                        <input
                            type="text"
                            name="loginName"
                            value={formData.loginName}
                            onChange={handleChange}
                            placeholder="Choose your login name"
                            className={`w-full p-2 border ${errors.loginName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white`}
                        />
                        {errors.loginName && (
                            <span className="text-red-500 text-sm font-medium">{errors.loginName}</span>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
                        />
                        {errors.password && (
                            <span className="text-red-500 text-sm">{errors.password}</span>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
                        />
                        {errors.confirmPassword && (
                            <span className="text-red-500 text-sm">{errors.confirmPassword}</span>
                        )}
                    </div>

                    {errors.submit && (
                        <div className="text-red-500 text-sm text-center font-medium p-2 bg-red-50 rounded-md border border-red-200">
                            {errors.submit}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium mt-6 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>

                    <p className="text-center mt-4 text-gray-600">
                        Already have an account?{' '}
                        <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}