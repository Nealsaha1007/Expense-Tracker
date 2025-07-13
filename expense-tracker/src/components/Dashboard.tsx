import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  useTheme,
  TextField,
  MenuItem,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button
} from '@mui/material';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import { 
  calculateTotalExpenses, 
  formatCurrency, 
  formatDate,
  getExpensesByCategory,
  getThisMonthExpenses,
  getExpensesByDate
} from '../utils/helpers';
import { EventRepeat as RepeatIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

// Register required ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

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

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { expenses } = useExpenses();
  const { recurringExpenses } = useRecurringExpenses();
  const { 
    incomeAmount,
    currency: incomeCurrency, 
    remainingBalance, 
    nextPaymentDate, 
    daysUntilPayday,
    paymentFrequency,
    salaryCreditDay 
  } = useIncome();
  const theme = useTheme();
  const [displayCurrency, setDisplayCurrency] = useState<string>(incomeCurrency || 'USD');

  // Filter expenses by selected currency
  const filteredExpenses = expenses.filter(expense => expense.currency === displayCurrency);
  
  const totalExpenses = calculateTotalExpenses(filteredExpenses);
  const thisMonthExpenses = getThisMonthExpenses(filteredExpenses);
  const thisMonthsTotal = calculateTotalExpenses(thisMonthExpenses);
  
  // Calculate percentage of income spent (only if income is available and currency matches)
  const percentSpent = incomeAmount > 0 && displayCurrency === incomeCurrency ? 
    Math.min(Math.round((totalExpenses / incomeAmount) * 100), 100) : 0;
  
  // For the category chart
  const expensesByCategory = getExpensesByCategory(filteredExpenses);
  const categories = Object.keys(expensesByCategory);
  const categoryAmounts = Object.values(expensesByCategory);
  
  // For the trend line chart
  const expensesByDate = getExpensesByDate(filteredExpenses);
  const dates = Object.keys(expensesByDate).slice(-7); // Last 7 dates
  const dateAmounts = dates.map(date => expensesByDate[date] || 0);

  // Generate colors for chart
  const generateChartColors = (count: number) => {
    const baseColors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      '#9c27b0', // purple
      '#795548', // brown
    ];
    
    return Array(count).fill(0).map((_, i) => baseColors[i % baseColors.length]);
  };

  // Category chart data
  const categoryChartData = {
    labels: categories,
    datasets: [
      {
        data: categoryAmounts,
        backgroundColor: generateChartColors(categories.length),
        borderWidth: 0,
      },
    ],
  };

  // Category chart options
  const categoryChartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  // Trend chart data
  const trendChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Daily Expenses',
        data: dateAmounts,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '80',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Trend chart options
  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // Handle currency change
  const handleCurrencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayCurrency(event.target.value);
  };

  // Most expensive categories
  const topCategories = [...categories]
    .sort((a, b) => expensesByCategory[b] - expensesByCategory[a])
    .slice(0, 3);
  
  // Get expense count by category
  const getExpenseCountByCategory = () => {
    return filteredExpenses.reduce((counts, expense) => {
      const { category } = expense;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const expenseCounts = getExpenseCountByCategory();
  
  // For the category count chart
  const categoryCountChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Number of Expenses',
        data: categories.map(category => expenseCounts[category] || 0),
        backgroundColor: theme.palette.secondary.main,
      },
    ],
  };

  const categoryCountChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Expense Count by Category',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Only show integers
        },
      },
    },
  };

  // Count expenses by currency
  const getCurrencyCounts = () => {
    return expenses.reduce((counts, expense) => {
      const { currency } = expense;
      counts[currency] = (counts[currency] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const currencyCounts = getCurrencyCounts();
  const availableCurrencies = Object.keys(currencyCounts);

  // Get upcoming recurring expenses
  const getUpcomingRecurringExpenses = () => {
    const upcoming = recurringExpenses
      .filter(expense => expense.active && expense.nextDueDate)
      .sort((a, b) => {
        if (!a.nextDueDate || !b.nextDueDate) return 0;
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      })
      .slice(0, 5); // Get top 5 upcoming
    
    return upcoming;
  };
  
  const upcomingRecurringExpenses = getUpcomingRecurringExpenses();

  // Get payment frequency display text
  const getPaymentFrequencyDisplay = () => {
    switch(paymentFrequency) {
      case 'monthly':
        return salaryCreditDay ? `Monthly (Day ${salaryCreditDay})` : 'Monthly';
      case 'biweekly':
        return 'Bi-Weekly';
      case 'weekly':
        return 'Weekly';
      case 'specific-date':
        return salaryCreditDay ? `Specific Date (Day ${salaryCreditDay})` : 'Specific Date';
      default:
        return 'Not set';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* Currency selector */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Currency to Display
        </Typography>
        <TextField
          select
          label="Currency"
          value={displayCurrency}
          onChange={handleCurrencyChange}
          fullWidth
          size="small"
          sx={{ maxWidth: 300 }}
        >
          {availableCurrencies.length > 0 ? 
            availableCurrencies.map((currencyCode) => {
              const currencyLabel = currencies.find(c => c.value === currencyCode)?.label || currencyCode;
              return (
                <MenuItem key={currencyCode} value={currencyCode}>
                  {currencyLabel} ({currencyCounts[currencyCode]} expenses)
                </MenuItem>
              );
            }) : 
            currencies.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          }
        </TextField>
      </Paper>

      {/* Financial overview */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Financial Overview
        </Typography>
        
        <Grid container spacing={3}>
          {/* Available Balance */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                bgcolor: theme.palette.success.light,
                color: theme.palette.success.contrastText
              }}
            >
              <CardContent sx={{ position: 'relative' }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Available Balance
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                  {displayCurrency === incomeCurrency ? formatCurrency(remainingBalance, incomeCurrency) : '---'}
                </Typography>
                {nextPaymentDate && daysUntilPayday !== null && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Next income in {daysUntilPayday} day{daysUntilPayday !== 1 ? 's' : ''}
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                      {formatDate(nextPaymentDate)}
                    </Box>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Total Monthly Income */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Income
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                  {displayCurrency === incomeCurrency && incomeAmount > 0 ? formatCurrency(incomeAmount, incomeCurrency) : '---'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {displayCurrency !== incomeCurrency ? 
                    'Switch to income currency to view' : 
                    incomeAmount <= 0 ? 'Set income in profile' : getPaymentFrequencyDisplay()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Total Expenses */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: theme.palette.error.light,
                color: theme.palette.error.contrastText
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Total Expenses
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                  {formatCurrency(totalExpenses, displayCurrency)}
                </Typography>
                {incomeAmount > 0 && displayCurrency === incomeCurrency && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {percentSpent}% of income
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Monthly expenses summary */}
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 2, mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              This Month's Summary
            </Typography>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {formatCurrency(thisMonthsTotal, displayCurrency)}
            </Typography>
            
            {/* ... rest of the code ... */}
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {filteredExpenses.length > 0 ? (
          <>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Expenses by Category ({displayCurrency})
                </Typography>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Doughnut data={categoryChartData} options={categoryChartOptions} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Expense Trend ({displayCurrency})
                </Typography>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Line data={trendChartData} options={trendChartOptions} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Expense Count by Category ({displayCurrency})
                </Typography>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Bar data={categoryCountChartData} options={categoryCountChartOptions} />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Spending Categories ({displayCurrency})
                </Typography>
                <Grid container spacing={2}>
                  {topCategories.map((category) => (
                    <Grid item xs={12} sm={4} key={category}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            {category}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(expensesByCategory[category], displayCurrency)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {expenseCounts[category] || 0} expense(s)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No expense data to show for {displayCurrency}
              </Typography>
              <Typography color="textSecondary">
                Add some expenses with {displayCurrency} to see insightful charts and statistics!
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Upcoming Recurring Expenses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Recurring Expenses
              </Typography>
              <Button 
                size="small" 
                color="primary" 
                variant="outlined"
                onClick={() => onNavigate('recurring')}
              >
                View All
              </Button>
            </Box>
            
            {upcomingRecurringExpenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No upcoming recurring expenses found.
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {upcomingRecurringExpenses.map((expense) => (
                  <ListItem key={expense.id} divider>
                    <ListItemIcon>
                      <RepeatIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={expense.description}
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" color="text.primary">
                            {formatCurrency(expense.amount, expense.currency)}
                          </Typography>
                          {expense.nextDueDate && (
                            <Typography variant="body2" component="div" color="text.secondary">
                              Next: {formatDate(expense.nextDueDate)}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                    <Chip 
                      label={expense.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 