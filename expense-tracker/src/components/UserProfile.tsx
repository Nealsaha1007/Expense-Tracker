import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Repeat as RepeatIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useIncome } from '../context/IncomeContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import IncomeInputModal from './IncomeInputModal';

const UserProfile: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { 
    incomeAmount, 
    currency, 
    salaryCreditDay, 
    nextPaymentDate, 
    daysUntilPayday,
    paymentFrequency,
    lastPaymentDate
  } = useIncome();
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  // Function to format the next payday date in a readable format
  const formatNextPayday = (date: string | null) => {
    if (!date) return 'Not set';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format the salary credit day ordinal (1st, 2nd, 3rd, etc.)
  const formatOrdinal = (day: number | null) => {
    if (day === null) return 'Not set';
    
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  // Get payment frequency display text
  const getPaymentFrequencyDisplay = () => {
    if (!paymentFrequency) return 'Not set';
    
    switch(paymentFrequency) {
      case 'monthly':
        return 'Monthly';
      case 'biweekly':
        return 'Bi-Weekly';
      case 'weekly':
        return 'Weekly';
      case 'specific-date':
        return 'Specific Date Each Month';
      default:
        return paymentFrequency;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        User Profile
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              fontSize: '2rem'
            }}
          >
            {user?.name?.charAt(0) || <PersonIcon fontSize="large" />}
          </Avatar>
          <Box sx={{ ml: 3 }}>
            <Typography variant="h5">{user?.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Income Details
        </Typography>
        
        <Grid container spacing={3}>
          {/* Income Amount */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Income Amount
                  </Typography>
                  <MoneyIcon color="primary" />
                </Box>
                <Typography variant="h4">
                  {incomeAmount ? formatCurrency(incomeAmount, currency) : 'Not set'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Payment Frequency */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Payment Frequency
                  </Typography>
                  <RepeatIcon color="primary" />
                </Box>
                <Typography variant="h4">
                  {getPaymentFrequencyDisplay()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Payment Date Settings */}
          {(paymentFrequency === 'monthly' || paymentFrequency === 'specific-date') && salaryCreditDay !== null && (
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Payment Date
                    </Typography>
                    <CalendarIcon color="primary" />
                  </Box>
                  <Typography variant="h4">
                    {formatOrdinal(salaryCreditDay)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    of every month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Last Payment Date - for biweekly/weekly */}
          {(paymentFrequency === 'biweekly' || paymentFrequency === 'weekly') && lastPaymentDate && (
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Last Payment Date
                    </Typography>
                    <DateRangeIcon color="primary" />
                  </Box>
                  <Typography variant="h4">
                    {formatDate(lastPaymentDate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Next Payment Date */}
          {nextPaymentDate && (
            <Grid item xs={12}>
              <Card elevation={1} sx={{ 
                p: 1, 
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText 
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">
                        Next Payment Date
                      </Typography>
                      <Typography variant="h6">
                        {formatNextPayday(nextPaymentDate)}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${daysUntilPayday} day${daysUntilPayday !== 1 ? 's' : ''} to go`} 
                      color="primary"
                      sx={{ 
                        bgcolor: theme.palette.background.default,
                        color: theme.palette.text.primary,
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EditIcon />}
                onClick={() => setShowIncomeModal(true)}
              >
                Update Income Details
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <IncomeInputModal 
        open={showIncomeModal} 
        onClose={() => setShowIncomeModal(false)}
        isFirstLogin={false}
      />
    </Box>
  );
};

export default UserProfile; 