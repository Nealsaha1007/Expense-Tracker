import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  BarChart as ChartIcon,
  CalendarToday as CalendarIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as ReportIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { useIncome } from '../context/IncomeContext';
import { downloadExpenseReport, downloadMonthlyReport } from '../utils/pdfGenerator';
import { getThisMonthExpenses, formatCurrency } from '../utils/helpers';
import jsPDF from 'jspdf';

const Reports: React.FC = () => {
  const { expenses, isLoading } = useExpenses();
  const { user } = useAuth();
  const { currency } = useIncome();
  
  const [reportType, setReportType] = useState<string>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Generate array of last 12 months for selection
  const getMonthOptions = () => {
    const months = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 12; i++) {
      let monthIndex = currentMonth - i;
      let yearValue = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        yearValue -= 1;
      }
      
      months.push({
        value: `${monthIndex},${yearValue}`,
        label: `${new Date(yearValue, monthIndex, 1).toLocaleString('default', { month: 'long' })} ${yearValue}`
      });
    }
    
    return months;
  };
  
  const handleMonthYearChange = (event: SelectChangeEvent) => {
    try {
      const value = event.target.value as string;
      const [month, year] = value.split(',').map(Number);
      
      if (isNaN(month) || isNaN(year)) {
        console.error('Invalid month or year:', { value, month, year });
        setSnackbarMessage('Invalid date selection');
        setSnackbarOpen(true);
        return;
      }
      
      setSelectedMonth(month);
      setSelectedYear(year);
    } catch (error) {
      console.error('Error in handleMonthYearChange:', error);
      setSnackbarMessage('Error changing date selection');
      setSnackbarOpen(true);
    }
  };
  
  const handleGenerateMonthlyReport = () => {
    try {
      // Filter expenses for the selected month and year
      const filteredExpenses = expenses.filter(expense => {
        try {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
        } catch (error) {
          console.error('Invalid date format in expense:', expense);
          return false;
        }
      });
      
      if (filteredExpenses.length === 0) {
        setSnackbarMessage('No expenses found for the selected period');
        setSnackbarOpen(true);
        return;
      }
      
      downloadMonthlyReport(
        filteredExpenses,
        selectedMonth,
        selectedYear,
        {
          currency,
          userName: user?.name || 'User'
        }
      );
      
      setSnackbarMessage('Report downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      setSnackbarMessage('Error generating report');
      setSnackbarOpen(true);
    }
  };
  
  const handleGenerateYearlyReport = () => {
    try {
      // Filter expenses for the selected year
      const filteredExpenses = expenses.filter(expense => {
        try {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === selectedYear;
        } catch (error) {
          console.error('Invalid date format in expense:', expense);
          return false;
        }
      });
      
      if (filteredExpenses.length === 0) {
        setSnackbarMessage('No expenses found for the selected year');
        setSnackbarOpen(true);
        return;
      }
      
      downloadExpenseReport(
        filteredExpenses,
        {
          title: 'Yearly Expense Report',
          subtitle: `${selectedYear}`,
          currency,
          period: `January - December ${selectedYear}`,
          userName: user?.name || 'User'
        },
        `yearly-expense-report-${selectedYear}.pdf`
      );
      
      setSnackbarMessage('Report downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating yearly report:', error);
      setSnackbarMessage('Error generating report');
      setSnackbarOpen(true);
    }
  };
  
  const handleGenerateFullReport = () => {
    try {
      if (expenses.length === 0) {
        setSnackbarMessage('No expenses found');
        setSnackbarOpen(true);
        return;
      }
      
      // Sort expenses by date for better organization
      const sortedExpenses = [...expenses].sort((a, b) => {
        try {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch (error) {
          return 0;
        }
      });
      
      downloadExpenseReport(
        sortedExpenses,
        {
          title: 'Complete Expense Report',
          subtitle: 'All Time Expenses',
          currency,
          period: 'All Time',
          userName: user?.name || 'User'
        },
        'complete-expense-report.pdf'
      );
      
      setSnackbarMessage('Report downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating full report:', error);
      setSnackbarMessage('Error generating report');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  const monthOptions = getMonthOptions();
  
  // Add a testPdfGeneration function
  const testPdfGeneration = () => {
    try {
      console.log('Testing PDF generation...');
      const doc = new jsPDF();
      doc.text('Test PDF Generation', 10, 10);
      doc.save('test.pdf');
      console.log('Test PDF generated successfully');
      return true;
    } catch (error) {
      console.error('Error generating test PDF:', error);
      return false;
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Get current month stats
  const currentMonthExpenses = getThisMonthExpenses(expenses);
  const totalCurrentMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports
        </Typography>
      </Box>
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">This Month</Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mb: 2 }}>
              {formatCurrency(totalCurrentMonth, currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentMonthExpenses.length} expenses recorded
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<DownloadIcon />}
              onClick={() => {
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
                handleGenerateMonthlyReport();
              }}
              sx={{ mt: 2, alignSelf: 'flex-start' }}
            >
              Download This Month
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DateRangeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Year to Date</Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mb: 2 }}>
              {formatCurrency(
                expenses
                  .filter(expense => new Date(expense.date).getFullYear() === new Date().getFullYear())
                  .reduce((sum, expense) => sum + expense.amount, 0),
                currency
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {expenses.filter(expense => new Date(expense.date).getFullYear() === new Date().getFullYear()).length} expenses this year
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<DownloadIcon />}
              onClick={handleGenerateYearlyReport}
              sx={{ mt: 2, alignSelf: 'flex-start' }}
            >
              Download Year Report
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ReportIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">All Time</Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mb: 2 }}>
              {formatCurrency(
                expenses.reduce((sum, expense) => sum + expense.amount, 0),
                currency
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {expenses.length} total expenses
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<DownloadIcon />}
              onClick={handleGenerateFullReport}
              sx={{ mt: 2, alignSelf: 'flex-start' }}
            >
              Download Complete
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Report generator */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Generate Custom Reports
      </Typography>
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generate Custom Report
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ width: 250 }}>
                <InputLabel id="month-year-select-label">Select Month & Year</InputLabel>
                <Select
                  labelId="month-year-select-label"
                  value={`${selectedMonth},${selectedYear}`}
                  onChange={handleMonthYearChange}
                  label="Select Month & Year"
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => {
                  console.log('Generating monthly report for:', {
                    month: selectedMonth,
                    year: selectedYear,
                    currency,
                    userName: user?.name
                  });
                  handleGenerateMonthlyReport();
                }}
              >
                Generate Monthly Report
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => {
                  console.log('Generating yearly report for:', {
                    year: selectedYear,
                    currency,
                    userName: user?.name
                  });
                  handleGenerateYearlyReport();
                }}
              >
                Generate Yearly Report
              </Button>

              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => {
                  console.log('Generating full report:', {
                    currency,
                    userName: user?.name,
                    totalExpenses: expenses.length
                  });
                  handleGenerateFullReport();
                }}
              >
                Generate Full Report
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Test PDF Generation */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test PDF Generation
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            const success = testPdfGeneration();
            setSnackbarMessage(success ? 'Test PDF generated successfully' : 'Failed to generate test PDF');
            setSnackbarOpen(true);
          }}
        >
          Generate Test PDF
        </Button>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarMessage.includes('Error') || snackbarMessage.includes('Failed') ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports; 