import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  Alert,
  FormHelperText,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  SelectChangeEvent
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useAuth } from '../context/AuthContext';
import { useIncome } from '../context/IncomeContext';
import { PaymentFrequency } from '../types';

interface IncomeInputModalProps {
  open: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

// Generate list of days (1-31) for the dropdown
const generateDayOptions = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push(i);
  }
  return days;
};

// Define payment frequency options
const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'specific-date', label: 'Specific Date Each Month' }
];

const IncomeInputModal: React.FC<IncomeInputModalProps> = ({ 
  open, 
  onClose,
  isFirstLogin = false
}) => {
  const { user } = useAuth();
  const { updateIncome, salaryCreditDay, paymentFrequency, lastPaymentDate } = useIncome();
  const [income, setIncome] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [selectedFrequency, setSelectedFrequency] = useState<PaymentFrequency>('monthly');
  const [selectedDay, setSelectedDay] = useState<number | ''>('');
  const [lastPayment, setLastPayment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Security timeout to prevent UI lock after 10 seconds
  useEffect(() => {
    if (open && loading) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Income update timeout reached - forcing UI unlock');
        setLoading(false);
        setError('Operation timed out. Please try again.');
      }, 10000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, loading]);

  // Initialize with user's current income if available
  useEffect(() => {
    if (user?.income) {
      setIncome(user.income.toString());
    }
    if (user?.currency) {
      setCurrency(user.currency);
    }
    if (paymentFrequency) {
      setSelectedFrequency(paymentFrequency);
    }
    if (salaryCreditDay !== null) {
      setSelectedDay(salaryCreditDay);
    } else {
      setSelectedDay('');
    }
    if (lastPaymentDate) {
      // Format the date for input field (YYYY-MM-DD)
      const date = new Date(lastPaymentDate);
      const formattedDate = date.toISOString().split('T')[0];
      setLastPayment(formattedDate);
    } else {
      // Default to today
      setLastPayment(new Date().toISOString().split('T')[0]);
    }
  }, [user, salaryCreditDay, paymentFrequency, lastPaymentDate, open]);

  const handleFrequencyChange = (event: SelectChangeEvent) => {
    const newFrequency = event.target.value as PaymentFrequency;
    setSelectedFrequency(newFrequency);
    
    // Reset day selection if switching from monthly/specific-date to other frequencies
    if (newFrequency !== 'monthly' && newFrequency !== 'specific-date') {
      setSelectedDay('');
    }
  };

  const handleSubmit = async () => {
    if (!income || parseFloat(income) <= 0) {
      setError('Please enter a valid income amount');
      return;
    }

    setError(null);
    setLoading(true);
    console.log('Submitting income:', { 
      income, 
      currency, 
      frequency: selectedFrequency,
      salaryCreditDay: selectedDay,
      lastPayment
    });

    try {
      // Convert income to number
      const incomeAmount = parseFloat(income);
      
      // Set up conditional parameters based on payment frequency
      let daySetting: number | undefined = undefined;
      let lastPaymentSetting: string | undefined = undefined;
      
      if (selectedFrequency === 'monthly' || selectedFrequency === 'specific-date') {
        daySetting = selectedDay === '' ? undefined : selectedDay as number;
      }
      
      if (selectedFrequency === 'biweekly' || selectedFrequency === 'weekly') {
        lastPaymentSetting = lastPayment || undefined;
      }
      
      // Update income with appropriate settings
      await updateIncome(
        incomeAmount, 
        currency, 
        selectedFrequency,
        daySetting,
        lastPaymentSetting
      );
      
      console.log('Income update successful, closing modal');
      
      // Clear any timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Always call onClose after successful update
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error updating income:', error);
      setError('Failed to update income. Please try again.');
      setLoading(false);
    }
  };

  // Simple close handler if user just wants to skip for now (non-first login)
  const handleSkip = () => {
    console.log('User skipped income update');
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onClose();
  };

  // Handle dialog close attempt
  const handleDialogClose = (event: React.SyntheticEvent<{}, Event>, reason: 'backdropClick' | 'escapeKeyDown') => {
    // If it's the first login, prevent closing by backdrop click or escape key
    if (isFirstLogin && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    // Otherwise, allow close
    handleSkip();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose as any}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isFirstLogin}
    >
      <DialogTitle>
        {isFirstLogin ? 'Welcome! Let\'s set up your income' : 'Update Income Settings'}
      </DialogTitle>
      <DialogContent>
        {isFirstLogin && (
          <Box mb={3}>
            <Typography variant="body1" color="text.secondary">
              To help you track your expenses effectively, please enter your income details.
              This will allow us to calculate your remaining balance and track your payment schedule.
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box my={2}>
          <TextField
            label="Income Amount"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            fullWidth
            type="number"
            required
            error={!!error}
            disabled={loading}
            InputProps={{
              startAdornment: currency === 'USD' || currency === 'GBP' || currency === 'EUR' ? (
                <InputAdornment position="start">
                  {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'}
                </InputAdornment>
              ) : undefined,
            }}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading} sx={{ mb: 3 }}>
                <InputLabel id="currency-select-label">Currency</InputLabel>
                <Select
                  labelId="currency-select-label"
                  value={currency}
                  label="Currency"
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading} sx={{ mb: 3 }}>
                <InputLabel id="frequency-select-label">Payment Frequency</InputLabel>
                <Select
                  labelId="frequency-select-label"
                  value={selectedFrequency}
                  label="Payment Frequency"
                  onChange={handleFrequencyChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <RepeatIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {PAYMENT_FREQUENCIES.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  How often do you receive income
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Conditionally show appropriate fields based on payment frequency */}
          {(selectedFrequency === 'monthly' || selectedFrequency === 'specific-date') && (
            <FormControl fullWidth disabled={loading} sx={{ mb: 3 }}>
              <InputLabel id="salary-day-select-label">Payment Date</InputLabel>
              <Select
                labelId="salary-day-select-label"
                value={selectedDay}
                label="Payment Date"
                onChange={(e) => setSelectedDay(e.target.value as number | '')}
                startAdornment={
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {generateDayOptions().map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Day of month when your payment is received
              </FormHelperText>
            </FormControl>
          )}
          
          {(selectedFrequency === 'biweekly' || selectedFrequency === 'weekly') && (
            <FormControl fullWidth disabled={loading} sx={{ mb: 3 }}>
              <InputLabel shrink htmlFor="last-payment-date">
                Last Payment Date
              </InputLabel>
              <TextField
                id="last-payment-date"
                type="date"
                value={lastPayment}
                onChange={(e) => setLastPayment(e.target.value)}
                disabled={loading}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormHelperText>
                When was your last payment received?
              </FormHelperText>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!isFirstLogin && (
          <Button onClick={handleSkip} color="inherit" disabled={loading}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncomeInputModal; 