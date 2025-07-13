import React, { useState } from 'react';
import { Button, Typography, Box, Paper, Alert } from '@mui/material';
import { auth, db } from './config';
import { collection, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const TestFirebase: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [dbStatus, setDbStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testAuth = async () => {
    try {
      setAuthStatus('pending');
      setErrorMessage(null);
      
      // Try anonymous sign in to test auth configuration
      await signInAnonymously(auth);
      setAuthStatus('success');
    } catch (error) {
      setAuthStatus('error');
      if (error instanceof Error) {
        setErrorMessage(`Authentication Error: ${error.message}`);
      } else {
        setErrorMessage('Unknown authentication error');
      }
    }
  };

  const testDb = async () => {
    try {
      setDbStatus('pending');
      setErrorMessage(null);
      
      // Try to read from Firestore to test DB configuration
      await getDocs(collection(db, 'expenses'));
      setDbStatus('success');
    } catch (error) {
      setDbStatus('error');
      if (error instanceof Error) {
        setErrorMessage(`Database Error: ${error.message}`);
      } else {
        setErrorMessage('Unknown database error');
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Firebase Configuration Tester
      </Typography>
      
      <Typography variant="body1" paragraph>
        Use this tool to check if your Firebase configuration is working correctly.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Authentication Status: {' '}
          <Box component="span" sx={{ 
            color: authStatus === 'success' ? 'green' : 
                  authStatus === 'error' ? 'red' : 'grey' 
          }}>
            {authStatus === 'success' ? '✅ Working' : 
             authStatus === 'error' ? '❌ Error' : '⏳ Not Tested'}
          </Box>
        </Typography>
        <Button 
          variant="contained" 
          onClick={testAuth} 
          sx={{ mt: 1 }}
        >
          Test Authentication
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Database Status: {' '}
          <Box component="span" sx={{ 
            color: dbStatus === 'success' ? 'green' : 
                  dbStatus === 'error' ? 'red' : 'grey' 
          }}>
            {dbStatus === 'success' ? '✅ Working' : 
             dbStatus === 'error' ? '❌ Error' : '⏳ Not Tested'}
          </Box>
        </Typography>
        <Button 
          variant="contained" 
          onClick={testDb} 
          sx={{ mt: 1 }}
        >
          Test Database
        </Button>
      </Box>
      
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
        If you're seeing errors, please make sure you've:
        <ol>
          <li>Replaced the default Firebase config with your own project's values</li>
          <li>Enabled Email/Password authentication in Firebase Console</li>
          <li>Created a Firestore database in your project</li>
          <li>Set appropriate Firestore security rules</li>
        </ol>
      </Typography>
    </Paper>
  );
};

export default TestFirebase; 