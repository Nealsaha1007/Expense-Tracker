import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  SelectChangeEvent,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EventRepeat as RepeatIcon,
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import { RecurringExpense } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useIncome } from '../context/IncomeContext';

// List of expense categories
const CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Housing',
  'Healthcare',
  'Other'
];

// Define time periods for recurring expenses
const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const RecurringExpenseManagement: React.FC = () => {
  const theme = useTheme();
  const { 
    recurringExpenses, 
    addRecurringExpense, 
    updateRecurringExpense, 
    deleteRecurringExpense,
    processRecurringExpenses, 
    isLoading 
  } = useRecurringExpenses();
  const { currency } = useIncome();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<RecurringExpense | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleOpenDialog = (expense?: RecurringExpense) => {
    if (expense) {
      // Edit existing expense
      setIsEditing(true);
      setCurrentExpense(expense);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setFrequency(expense.frequency);
      setStartDate(expense.startDate.split('T')[0]);
      setEndDate(expense.endDate ? expense.endDate.split('T')[0] : '');
    } else {
      // Create new expense
      setIsEditing(false);
      setCurrentExpense(null);
      setDescription('');
      setAmount('');
      setCategory('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
    setFormError('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!description || !amount || !category || !frequency || !startDate) {
      setFormError('All required fields must be filled');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      if (isEditing && currentExpense) {
        // Update existing expense
        await updateRecurringExpense(currentExpense.id, {
          description,
          amount: amountNum,
          category,
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          currency
        });
      } else {
        // Create new expense
        await addRecurringExpense({
          description,
          amount: amountNum,
          category,
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          currency,
          active: true
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      setFormError('An error occurred while saving the expense');
    }
  };
  
  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      await deleteRecurringExpense(expenseId);
    }
  };
  
  const getFrequencyLabel = (frequency: string) => {
    const found = FREQUENCIES.find(f => f.value === frequency);
    return found ? found.label : frequency;
  };
  
  const handleProcessExpenses = async () => {
    setIsProcessing(true);
    try {
      const processed = await processRecurringExpenses();
      
      if (processed && processed.length > 0) {
        setSnackbarMessage(`Successfully created ${processed.length} expense(s) from recurring items`);
      } else {
        setSnackbarMessage('No recurring expenses due for processing at this time');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
      setSnackbarMessage('Error processing recurring expenses');
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Recurring Expenses
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleProcessExpenses}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Now'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Recurring Expense
          </Button>
        </Box>
      </Box>
      
      {recurringExpenses.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You haven't set up any recurring expenses yet.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Recurring Expense
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recurringExpenses.map((expense) => (
            <Grid item xs={12} sm={6} md={4} key={expense.id}>
              <Paper sx={{ p: 2, height: '100%', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(expense)}
                    sx={{ mr: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RepeatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" sx={{ width: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {expense.description}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ my: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(expense.amount, expense.currency)}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    <Chip 
                      label={expense.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<RepeatIcon />}
                      label={getFrequencyLabel(expense.frequency)} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                    {!expense.active && (
                      <Chip 
                        label="Inactive" 
                        size="small" 
                        color="error" 
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="body2">
                      Started: {formatDate(expense.startDate)}
                    </Typography>
                  </Box>
                  
                  {expense.endDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <EventIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        Ends: {formatDate(expense.endDate)}
                      </Typography>
                    </Box>
                  )}
                  
                  {expense.nextDueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventAvailableIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        Next: {formatDate(expense.nextDueDate)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Recurring Expense Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Recurring Expense' : 'Create Recurring Expense'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {currency}
                    </Typography>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={frequency}
                  label="Frequency"
                  onChange={(e: SelectChangeEvent) => setFrequency(e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly')}
                >
                  {FREQUENCIES.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date (Optional)"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarMessage.includes('Error') ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecurringExpenseManagement; 