import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';
import { Snackbar, Alert, Typography, Paper, Box } from '@mui/material';

const Auth: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof Error) {
        // Extract Firebase error message
        const errorMessage = err.message;
        // Check if it's a Firebase auth error (contains "auth/" in the message)
        if (errorMessage.includes('auth/')) {
          const cleanError = errorMessage
            .replace('Firebase: Error (auth/', '')
            .replace(').', '');
          
          // Make error message more user-friendly
          switch (cleanError) {
            case 'invalid-credential':
              setError('Invalid email or password. Please try again.');
              break;
            case 'user-not-found':
              setError('No account found with this email. Please register first.');
              break;
            case 'wrong-password':
              setError('Incorrect password. Please try again.');
              break;
            case 'too-many-requests':
              setError('Too many failed login attempts. Please try again later.');
              break;
            default:
              setError(`Login failed: ${cleanError}`);
          }
        } else {
          setError(`Login error: ${errorMessage}`);
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
      console.error('Login error:', err);
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      await register(name, email, password);
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;
        if (errorMessage.includes('auth/')) {
          const cleanError = errorMessage
            .replace('Firebase: Error (auth/', '')
            .replace(').', '');
          
          switch (cleanError) {
            case 'email-already-in-use':
              setError('This email is already registered. Try logging in instead.');
              break;
            case 'weak-password':
              setError('Password is too weak. Use at least 6 characters.');
              break;
            case 'invalid-email':
              setError('Please enter a valid email address.');
              break;
            default:
              setError(`Registration failed: ${cleanError}`);
          }
        } else {
          setError(`Registration error: ${err.message}`);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
      console.error('Registration error:', err);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      {/* Firebase Config Check */}
      {window.location.hostname === 'localhost' && 
       document.querySelector('script')?.textContent?.includes('YOUR_API_KEY') && (
        <Box sx={{ mb: 4, mt: 2, mx: 'auto', maxWidth: 600 }}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#fff8e1' }}>
            <Typography variant="h6" color="error" gutterBottom>
              ⚠️ Firebase Configuration Missing
            </Typography>
            <Typography variant="body1" paragraph>
              You need to update the Firebase configuration in <code>src/firebase/config.ts</code> with your actual Firebase project values.
            </Typography>
            <Typography variant="body2">
              1. Go to your Firebase console<br />
              2. Select your project<br />
              3. Click on the web app settings (gear icon)<br />
              4. Copy the firebaseConfig object<br />
              5. Replace the placeholder values in src/firebase/config.ts
            </Typography>
          </Paper>
        </Box>
      )}

      {isLoginView ? (
        <Login 
          onLogin={handleLogin} 
          onRegisterClick={toggleView} 
          isLoading={isLoading} 
        />
      ) : (
        <Register 
          onRegister={handleRegister} 
          onLoginClick={toggleView}
          isLoading={isLoading} 
        />
      )}
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Auth; 