// vaultService.js
import axios from 'axios';

// Configure this with your vault service details
const VAULT_URL = 'http://vault:8200';
const VAULT_TOKEN = 'hvs.RVcbNFgwptFX3HzQ1veOHPqL'; // Best to get this from a secure source

// Function to fetch secrets from vault
export const fetchSecretFromVault = async (secretPath) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${VAULT_URL}/v1/${secretPath}`,
      headers: {
        'X-Vault-Token': VAULT_TOKEN
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching from vault:', error);
    return null;
  }
};

// Function to get environment variables from various sources
export const getEnvVariable = async (key) => {
  // Try to get from vault first
  try {
    // Adjust the secret path according to your vault structure
    const secrets = await fetchSecretFromVault('secret/app-config');
    if (secrets && secrets[key]) {
      return secrets[key];
    }
  } catch (err) {
    console.warn(`Failed to fetch ${key} from vault:`, err);
  }
  
  // Fallbacks if vault fails
  // For Vite
  if (import.meta?.env) {
    return import.meta.env[`VITE_${key}`];
  }
  // For Create React App
  if (window.ENV) {
    return window.ENV[key];
  }
  // Fallback
  return "";
};

// Modified AUTH_CONFIG to use the vault service
export const initializeAuthConfig = async () => {
  const CLIENT_ID = await getEnvVariable('42_CLIENT_ID');
  const REDIRECT_URI = await getEnvVariable('42_REDIRECT_URI');
  const API_URL = await getEnvVariable('API_URL');
  
  log.console(CLIENT_ID);
  log.console(REDIRECT_URI);
  log.console(API_URL);
  return {
    CLIENT_ID,
    REDIRECT_URI,
    API_URL
  };
};

// API URLs based on current location
export const API_BASE_URL = `https://${window.location.host}/api`;
export const WS_BASE_URL = `wss://${window.location.host}/ws`;