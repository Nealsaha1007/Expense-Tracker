import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Typography, 
  Box, 
  IconButton, 
  Fade,
  Paper,
  Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { green } from '@mui/material/colors';

interface SuccessNotificationProps {
  open: boolean;
  onClose: () => void;
  message: string;
  amount: string;
  currency: string;
  category: string;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  open,
  onClose,
  message,
  amount,
  currency,
  category
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  // Format the currency for display
  const formatCurrency = (value: string, currencyCode: string) => {
    try {
      // Use a safer default if currency code is invalid
      const validCurrency = currencyCode && /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : 'USD';
      
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
      });
      
      return formatter.format(Number(value));
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback formatting if Intl.NumberFormat fails
      return `${currencyCode || '$'} ${parseFloat(value).toFixed(2)}`;
    }
  };

  // Trigger animation when the dialog opens
  useEffect(() => {
    if (open) {
      setShowAnimation(true);
      
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        setShowAnimation(false);
      };
    }
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
    >
      <DialogContent sx={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Close button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Main content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 5,
            textAlign: 'center',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)' 
              : 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative particles */}
          {showAnimation && (
            <>
              {[...Array(20)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    width: theme => Math.random() * 10 + 5,
                    height: theme => Math.random() * 10 + 5,
                    borderRadius: '50%',
                    backgroundColor: theme => [
                      theme.palette.primary.main,
                      theme.palette.secondary.main,
                      green[500],
                      theme.palette.warning.main,
                      theme.palette.info.main
                    ][Math.floor(Math.random() * 5)],
                    top: '0%',
                    left: `${Math.random() * 100}%`,
                    opacity: 0,
                    animation: `fall 1s ease forwards ${Math.random() * 0.5}s`,
                    '@keyframes fall': {
                      '0%': { 
                        transform: 'translateY(-20px) rotate(0deg)', 
                        opacity: 1 
                      },
                      '100%': { 
                        transform: `translateY(${Math.random() * 400 + 100}px) rotate(${Math.random() * 360}deg)`, 
                        opacity: 0 
                      }
                    }
                  }}
                />
              ))}
            </>
          )}
          
          <Avatar
            sx={{
              bgcolor: green[500],
              width: 80,
              height: 80,
              mb: 2,
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              animation: showAnimation ? 'bounce 0.5s ease' : 'none',
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-20px)' },
                '60%': { transform: 'translateY(-10px)' }
              }
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 50 }} />
          </Avatar>
          
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
            {message}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Your expense has been successfully recorded
          </Typography>
          
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mt: 3,
              mb: 2,
              borderRadius: '12px',
              width: '100%',
              maxWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transform: showAnimation ? 'scale(1)' : 'scale(0)',
              opacity: showAnimation ? 1 : 0,
              transition: 'transform 0.5s, opacity 0.5s',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Amount:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(amount, currency)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Category:
              </Typography>
              <Typography variant="body1">
                {category}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessNotification; 