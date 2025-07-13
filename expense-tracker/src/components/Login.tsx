import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Box, 
  Container, 
  Grid, 
  CircularProgress, 
  Link
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegisterClick, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      setLocalLoading(true);
      await onLogin(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Combine both loading states
  const isDisabled = isLoading || localLoading;

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AccountCircleIcon color="primary" sx={{ fontSize: 60, mb: 1 }} />
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isDisabled}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isDisabled}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isDisabled}
            sx={{ mt: 3, mb: 2, height: 48, position: 'relative' }}
          >
            {isDisabled ? (
              <CircularProgress size={24} sx={{ position: 'absolute' }} />
            ) : (
              'Sign In'
            )}
          </Button>
          
          <Grid container justifyContent="center">
            <Grid item>
              <Link 
                component="button" 
                variant="body2" 
                onClick={onRegisterClick}
                disabled={isDisabled}
                sx={{ 
                  textDecoration: 'none', 
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link 
          href="/reset.html" 
          target="_blank"
          variant="caption" 
          color="text.secondary"
        >
          Having trouble? Reset Firebase session
        </Link>
      </Box>
    </Container>
  );
};

export default Login; 