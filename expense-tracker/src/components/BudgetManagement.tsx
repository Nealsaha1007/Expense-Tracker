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
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useBudgets } from '../context/BudgetContext';
import { Budget } from '../types';
import { formatCurrency } from '../utils/helpers';
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

// Define time periods for budgets
const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' }
];

const BudgetManagement: React.FC = () => {
  const theme = useTheme();
  const { budgets, categoryBudgets, addBudget, updateBudget, deleteBudget, isLoading } = useBudgets();
  const { currency } = useIncome();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  
  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [formError, setFormError] = useState('');
  
  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      // Edit existing budget
      setIsEditing(true);
      setCurrentBudget(budget);
      setCategory(budget.category);
      setAmount(budget.amount.toString());
      setPeriod(budget.period);
    } else {
      // Create new budget
      setIsEditing(false);
      setCurrentBudget(null);
      setCategory('');
      setAmount('');
      setPeriod('monthly');
    }
    setFormError('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!category || !amount || !period) {
      setFormError('All fields are required');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      if (isEditing && currentBudget) {
        // Update existing budget
        await updateBudget(currentBudget.id, {
          category,
          amount: amountNum,
          period,
          currency
        });
      } else {
        // Create new budget
        await addBudget({
          category,
          amount: amountNum,
          period,
          currency
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving budget:', error);
      setFormError('An error occurred while saving the budget');
    }
  };
  
  const handleDelete = async (budgetId: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(budgetId);
    }
  };
  
  // Helper to get color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return theme.palette.success.main;
    if (percentage < 90) return theme.palette.warning.main;
    return theme.palette.error.main;
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
          Budget Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Budget
        </Button>
      </Box>
      
      {budgets.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You haven't set any budgets yet.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Budget
          </Button>
        </Paper>
      ) : (
        <>
          {/* Budget progress section */}
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
            Monthly Budget Progress
          </Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
            {categoryBudgets.length === 0 ? (
              <Typography variant="body2">
                No monthly budgets have been set.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {categoryBudgets.map((budget) => (
                  <Grid item xs={12} sm={6} md={4} key={budget.category}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">{budget.category}</Typography>
                        <Typography variant="subtitle1">
                          {formatCurrency(budget.spentAmount, currency)} / {formatCurrency(budget.budgetAmount, currency)}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', position: 'relative' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={budget.percentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProgressColor(budget.percentage)
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {budget.percentage.toFixed(0)}% used
                        </Typography>
                        {budget.percentage >= 90 && (
                          <Typography variant="caption" color="error">
                            Budget limit reached!
                          </Typography>
                        )}
                        {budget.percentage >= 70 && budget.percentage < 90 && (
                          <Typography variant="caption" color="warning.main">
                            Approaching limit
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
          
          {/* All Budgets section */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            All Budgets
          </Typography>
          <Grid container spacing={3}>
            {budgets.map((budget) => (
              <Grid item xs={12} sm={6} md={4} key={budget.id}>
                <Paper sx={{ p: 2, height: '100%', position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(budget)}
                      sx={{ mr: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">{budget.category}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(budget.amount, budget.currency)}
                    </Typography>
                    <Chip 
                      label={budget.period} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  
                  {/* If it's a monthly budget, show progress */}
                  {budget.period === 'monthly' && categoryBudgets.some(cb => cb.category === budget.category) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Progress:
                      </Typography>
                      {categoryBudgets
                        .filter(cb => cb.category === budget.category)
                        .map(cb => (
                          <Box key={cb.category} sx={{ width: '100%', mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={cb.percentage}
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: theme.palette.grey[200],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getProgressColor(cb.percentage)
                                }
                              }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="caption">
                                {formatCurrency(cb.spentAmount, budget.currency)}
                              </Typography>
                              <Typography variant="caption">
                                {cb.percentage.toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
      
      {/* Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
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
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  label="Period"
                  onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                >
                  {PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
    </Box>
  );
};

export default BudgetManagement; 