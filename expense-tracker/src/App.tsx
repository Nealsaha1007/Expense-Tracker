import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, Box, ThemeProvider, createTheme, CircularProgress, Button } from '@mui/material';
import { ExpenseProvider } from './context/ExpenseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IncomeProvider } from './context/IncomeContext';
import { BudgetProvider } from './context/BudgetContext';
import { RecurringExpenseProvider } from './context/RecurringExpenseContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Auth from './components/Auth';
import TestFirebase from './firebase/TestFirebase';
import SimpleFirebaseTest from './components/SimpleFirebaseTest';
import IncomeInputModal from './components/IncomeInputModal';
import UserProfile from './components/UserProfile';
import BudgetManagement from './components/BudgetManagement';
import Reports from './components/Reports';
import RecurringExpenseManagement from './components/RecurringExpenseManagement';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Main content component that requires authentication
const MainContent = () => {
  const { user, isAuthenticated, isLoading, logout, hasSetIncome } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showFirebaseTest, setShowFirebaseTest] = useState(false);
  const [showSimpleFirebaseTest, setShowSimpleFirebaseTest] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  // Show income input modal when user logs in but hasn't set income yet
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, hasSetIncome });
    
    if (isAuthenticated && !hasSetIncome) {
      console.log('Showing income modal for first-time setup');
      // Allow a slight delay before showing the modal to ensure the app is fully rendered
      setTimeout(() => {
        setShowIncomeModal(true);
      }, 500);
    } else if (isAuthenticated && hasSetIncome) {
      console.log('Income already set, closing modal if open');
      setShowIncomeModal(false);
    } else if (!isAuthenticated) {
      // Reset modal when user logs out
      console.log('User logged out, closing income modal');
      setShowIncomeModal(false);
    }
  }, [isAuthenticated, hasSetIncome]);

  // Show loading spinner while checking authentication state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Simple Firebase test
  if (showSimpleFirebaseTest) {
    return (
      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => setShowSimpleFirebaseTest(false)}
          sx={{ mb: 2 }}
        >
          Back to App
        </Button>
        <SimpleFirebaseTest />
      </Box>
    );
  }

  // Special Firebase test page - accessible even when not logged in
  if (showFirebaseTest) {
    return (
      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => setShowFirebaseTest(false)}
          sx={{ mb: 2 }}
        >
          Back to App
        </Button>
        <TestFirebase />
      </Box>
    );
  }

  // If not authenticated, show login/register screen
  if (!isAuthenticated) {
    return (
      <>
        <Auth />
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => setShowFirebaseTest(true)}
            sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
          >
            Firebase Configuration Test
          </Button>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => setShowSimpleFirebaseTest(true)}
            sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
          >
            Simple Firebase Test
          </Button>
        </Box>
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'expenses':
        return <ExpenseList />;
      case 'add':
        return <ExpenseForm />;
      case 'budget':
        return <BudgetManagement />;
      case 'reports':
        return <Reports />;
      case 'recurring':
        return <RecurringExpenseManagement />;
      case 'profile':
        return <UserProfile />;
      case 'test-firebase':
        return <TestFirebase />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
      />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {renderPage()}
      </Container>
      <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
        © {new Date().getFullYear()} Expense Tracker
      </Box>
      
      {/* Income Input Modal */}
      <IncomeInputModal 
        open={showIncomeModal} 
        onClose={() => {
          console.log('Closing income modal');
          setShowIncomeModal(false);
        }}
        isFirstLogin={!hasSetIncome}
      />
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <BudgetProvider>
              <RecurringExpenseProvider>
                <MainContent />
              </RecurringExpenseProvider>
            </BudgetProvider>
          </IncomeProvider>
        </ExpenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
