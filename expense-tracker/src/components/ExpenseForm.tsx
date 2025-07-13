import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  MenuItem, 
  Typography, 
  Paper,
  Grid
} from '@mui/material';
import { Expense, ExpenseCategory } from '../types';
import { useExpenses } from '../context/ExpenseContext';
import SuccessNotification from './SuccessNotification';

const categories: ExpenseCategory[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Housing',
  'Healthcare',
  'Other'
];

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

interface ExpenseFormProps {
  editingExpense?: Expense;
  onFinishEdit?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  editingExpense,
  onFinishEdit 
}) => {
  const { addExpense, editExpense } = useExpenses();
  const [successNotification, setSuccessNotification] = useState({
    open: false,
    message: '',
    amount: '',
    currency: '',
    category: ''
  });

  const [formValues, setFormValues] = useState({
    description: editingExpense?.description || '',
    amount: editingExpense?.amount.toString() || '',
    category: editingExpense?.category || 'Food',
    date: editingExpense?.date || new Date().toISOString().split('T')[0],
    currency: editingExpense?.currency || 'USD'
  });

  const [errors, setErrors] = useState({
    description: false,
    amount: false,
    date: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: false
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      description: !formValues.description,
      amount: !formValues.amount || isNaN(Number(formValues.amount)) || Number(formValues.amount) <= 0,
      date: !formValues.date
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const expenseData = {
      description: formValues.description,
      amount: Number(formValues.amount),
      category: formValues.category,
      date: formValues.date,
      currency: formValues.currency
    };

    if (editingExpense) {
      editExpense(editingExpense.id, expenseData);
      if (onFinishEdit) onFinishEdit();
      
      // Show success notification for editing
      setSuccessNotification({
        open: true,
        message: 'Expense Updated!',
        amount: formValues.amount,
        currency: formValues.currency,
        category: formValues.category
      });
    } else {
      addExpense(expenseData);
      
      // Show success notification for adding
      setSuccessNotification({
        open: true,
        message: 'Expense Added!',
        amount: formValues.amount,
        currency: formValues.currency,
        category: formValues.category
      });
      
      // Reset form after adding
      setFormValues({
        description: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        currency: 'USD'
      });
    }
  };

  const handleCloseNotification = () => {
    setSuccessNotification({ ...successNotification, open: false });
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                fullWidth
                required
                error={errors.description}
                helperText={errors.description ? 'Description is required' : ''}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                name="amount"
                type="number"
                value={formValues.amount}
                onChange={handleChange}
                fullWidth
                required
                error={errors.amount}
                helperText={errors.amount ? 'Valid amount is required' : ''}
                margin="normal"
                inputProps={{ min: "0.01", step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Currency"
                name="currency"
                value={formValues.currency}
                onChange={handleChange}
                fullWidth
                margin="normal"
              >
                {currencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={formValues.date}
                onChange={handleChange}
                fullWidth
                required
                error={errors.date}
                helperText={errors.date ? 'Date is required' : ''}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Category"
                name="category"
                value={formValues.category}
                onChange={handleChange}
                fullWidth
                margin="normal"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                sx={{ mt: 2 }}
              >
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Success Notification */}
      <SuccessNotification
        open={successNotification.open}
        onClose={handleCloseNotification}
        message={successNotification.message}
        amount={successNotification.amount}
        currency={successNotification.currency || 'USD'}
        category={successNotification.category}
      />
    </>
  );
};

export default ExpenseForm; 