import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  FormatListBulleted as ListIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  PieChart as BudgetIcon,
  Assessment as ReportsIcon,
  Receipt as ExpensesIcon,
  Repeat as RecurringIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
    { id: 'add', label: 'Add Expense', icon: <AddIcon /> },
    { id: 'budget', label: 'Budget', icon: <BudgetIcon /> },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
    { id: 'recurring', label: 'Recurring', icon: <RecurringIcon /> },
    { id: 'profile', label: 'Profile', icon: <PersonIcon /> }
  ];

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Expense Tracker
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navigationItems.map((item) => (
            <Button 
              key={item.id}
              color="inherit" 
              startIcon={isMobile ? null : item.icon}
              onClick={() => setCurrentPage(item.id)}
              sx={{ 
                display: 'flex', 
                bgcolor: currentPage === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderRadius: 1,
                padding: isMobile ? '6px 8px' : '6px 16px',
              }}
            >
              {isMobile ? item.icon : item.label}
            </Button>
          ))}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.secondary.main,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage('profile')}
              >
                {user.name ? getInitials(user.name) : user.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
                Logout
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 