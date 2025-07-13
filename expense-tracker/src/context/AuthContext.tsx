import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { registerUser, loginUser, logoutUser, getUserIncome, saveUserIncome } from '../firebase/services';
import { AuthContextType, User } from '../types';

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSetIncome, setHasSetIncome] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Function to check if user has set income
  const checkUserIncome = async (userId: string) => {
    try {
      const incomeData = await getUserIncome(userId);
      if (incomeData) {
        setHasSetIncome(true);
        // Update user with income data
        setUser(currentUser => 
          currentUser ? {
            ...currentUser,
            income: incomeData.amount,
            currency: incomeData.currency
          } : null
        );
      } else {
        setHasSetIncome(false);
      }
    } catch (error) {
      console.error('Error checking user income:', error);
      // If we get a permission error, we'll assume income is not set
      // instead of blocking the whole app
      setHasSetIncome(false);
      
      // Show a more descriptive error
      if (error instanceof Error && error.message.includes('permission')) {
        console.error(
          'Firebase permission error: Please update your Firestore security rules to allow access to the userIncome collection. See UPDATE_FIREBASE_RULES.md for instructions.'
        );
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading && !authInitialized) {
        console.warn('Auth loading timeout reached, forcing initialization');
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // 5 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed, user:', firebaseUser ? 'logged in' : 'logged out');
      setIsLoading(true);
      
      try {
        if (firebaseUser) {
          // User is signed in
          console.log('User authenticated:', {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email
          });
          
          // Set base user data
          const userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
          };
          
          setUser(userData);
          
          // Check if user has set income
          await checkUserIncome(firebaseUser.uid);
        } else {
          // User is signed out
          console.log('User is signed out');
          setUser(null);
          setHasSetIncome(false);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        // Prevent the app from getting stuck on error
        setUser(null);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
        clearTimeout(loadingTimeout);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []); // Empty dependency array is fine here as we only want to run once on mount

  // Register a new user
  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await registerUser(name, email, password);
      // onAuthStateChanged will set the user
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Login a user
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await loginUser(email, password);
      // onAuthStateChanged will set the user
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout the current user
  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      // onAuthStateChanged will set the user to null
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  // Update user income
  const updateUserIncome = async (income: number, currency: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setIsLoading(true);
      
      // Save to Firebase
      await saveUserIncome(user.id, income, currency);
      
      console.log('Income updated successfully:', { income, currency });
      
      // Update local user state
      setUser(currentUser => 
        currentUser ? {
          ...currentUser,
          income,
          currency
        } : null
      );
      
      // Mark that income has been set
      setHasSetIncome(true);
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserIncome,
        hasSetIncome
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 