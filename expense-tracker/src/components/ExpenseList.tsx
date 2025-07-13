import React, { useState } from 'react';
import { 
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Divider,
  Box,
  Chip,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import ExpenseForm from './ExpenseForm';
import { Expense, ExpenseCategory } from '../types';

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

const ExpenseList: React.FC = () => {
  const { expenses, deleteExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
  };

  const handleFinishEdit = () => {
    setEditingExpense(null);
  };

  // Filter and sort expenses
  const filteredAndSortedExpenses = [...expenses]
    .filter(expense => {
      // Filter by search term
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      // Filter by category
      const matchesCategory = filterCategory ? expense.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (sortBy) {
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  return (
    <>
      {editingExpense ? (
        <ExpenseForm 
          editingExpense={editingExpense} 
          onFinishEdit={handleFinishEdit} 
        />
      ) : null}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Expenses
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search expenses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              select
              label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              select
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="date-desc">Date (Newest first)</MenuItem>
              <MenuItem value="date-asc">Date (Oldest first)</MenuItem>
              <MenuItem value="amount-desc">Amount (Highest first)</MenuItem>
              <MenuItem value="amount-asc">Amount (Lowest first)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        
        {filteredAndSortedExpenses.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', my: 3 }}>
            No expenses found. Add some expenses to get started!
          </Typography>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredAndSortedExpenses.map((expense, index) => (
              <React.Fragment key={expense.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography component="span" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        <Typography component="span" fontWeight="bold" color="primary">
                          {formatCurrency(expense.amount, expense.currency)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography component="span" variant="body2" color="text.primary">
                          {formatDate(expense.date)}
                        </Typography>
                        <Chip 
                          label={expense.category} 
                          size="small" 
                          sx={{ ml: 1, fontSize: '0.75rem' }}
                        />
                        <Chip 
                          label={expense.currency} 
                          size="small" 
                          color="secondary"
                          sx={{ ml: 1, fontSize: '0.75rem' }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(expense)} size="small" sx={{ mr: 1 }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(expense.id)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
};

export default ExpenseList; 