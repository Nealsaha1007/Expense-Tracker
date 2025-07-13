import React, { useState } from 'react';
import { Button, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import { testFirebaseAuth } from '../firebase/simpleTest';

const SimpleFirebaseTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    uid?: string;
    error?: {
      code: string;
      message: string;
    };
  } | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const testResult = await testFirebaseAuth();
      setResult(testResult);
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: {
          code: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Simple Firebase Authentication Test
      </Typography>
      
      <Typography variant="body1" paragraph>
        This is a simplified test that tries to use anonymous authentication with Firebase.
        If this works, your Firebase configuration is correct.
      </Typography>
      
      <Box sx={{ my: 3 }}>
        <Button 
          variant="contained" 
          onClick={runTest} 
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Run Simple Test'}
        </Button>
      </Box>
      
      {result && (
        <Box sx={{ mt: 2 }}>
          {result.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body1">
                Success! Firebase authentication is working correctly.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Generated User ID: {result.uid}
              </Typography>
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1">
                Firebase authentication failed with error:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                {result.error?.code}: {result.error?.message}
              </Typography>
            </Alert>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Common Error Solutions:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li><strong>auth/operation-not-allowed</strong>: Enable Anonymous Authentication in Firebase Console</li>
          <li><strong>auth/network-request-failed</strong>: Check your internet connection</li>
          <li><strong>auth/api-key-not-valid</strong>: Your API key is incorrect or restricted</li>
          <li><strong>auth/app-deleted</strong>: The Firebase app was deleted</li>
        </Typography>
      </Box>
    </Paper>
  );
};

export default SimpleFirebaseTest; 