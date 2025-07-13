import React, { createContext, useContext, useState, useEffect } from 'react';
import { RecurringExpense, RecurringExpenseContextType } from '../types';
import { useAuth } from './AuthContext';
import { useExpenses } from './ExpenseContext';
import {
  getUserRecurringExpenses,
  addRecurringExpense as addRecurringExpenseToFirestore,
  updateRecurringExpense as updateRecurringExpenseInFirestore,
  deleteRecurringExpense as deleteRecurringExpenseFromFirestore,
  processRecurringExpenses as processRecurringExpensesInFirestore
} from '../firebase/services';

const RecurringExpenseContext = createContext<RecurringExpenseContextType | undefined>(undefined);

export const useRecurringExpenses = () => {
  const context = useContext(RecurringExpenseContext);
  if (!context) {
    throw new Error('useRecurringExpenses must be used within a RecurringExpenseProvider');
  }
  return context;
};

interface RecurringExpenseProviderProps {
  children: React.ReactNode;
}

export const RecurringExpenseProvider: React.FC<RecurringExpenseProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recurring expenses when user changes
  useEffect(() => {
    const fetchRecurringExpenses = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const userRecurringExpenses = await getUserRecurringExpenses(user.id);
          setRecurringExpenses(userRecurringExpenses);
        } else {
          setRecurringExpenses([]);
        }
      } catch (error) {
        console.error('Error fetching recurring expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecurringExpenses();
  }, [user]);

  // Check for recurring expenses to process on app load and when expenses change
  useEffect(() => {
    const checkRecurringExpenses = async () => {
      if (!user) return;
      
      try {
        await processRecurringExpenses();
        
        // Refresh recurring expenses after processing
        const userRecurringExpenses = await getUserRecurringExpenses(user.id);
        setRecurringExpenses(userRecurringExpenses);
      } catch (error) {
        console.error('Error checking recurring expenses:', error);
      }
    };
    
    if (user) {
      checkRecurringExpenses();
    }
  }, [user, expenses]);

  const addRecurringExpense = async (
    expenseData: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastProcessed' | 'nextDueDate'>
  ) => {
    if (!user) return;
    
    try {
      const newExpense = await addRecurringExpenseToFirestore(expenseData, user.id);
      setRecurringExpenses(prev => [newExpense, ...prev]);
    } catch (error) {
      console.error('Error adding recurring expense:', error);
    }
  };

  const updateRecurringExpense = async (
    id: string,
    expenseData: Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!user) return;
    
    try {
      const updatedExpense = await updateRecurringExpenseInFirestore(id, expenseData);
      setRecurringExpenses(prev => 
        prev.map(expense => expense.id === id ? updatedExpense : expense)
      );
    } catch (error) {
      console.error('Error updating recurring expense:', error);
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteRecurringExpenseFromFirestore(id);
      setRecurringExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
    }
  };

  const processRecurringExpenses = async () => {
    if (!user) return;
    
    try {
      const processed = await processRecurringExpensesInFirestore(user.id);
      return processed;
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
    }
  };

  return (
    <RecurringExpenseContext.Provider
      value={{
        recurringExpenses,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        processRecurringExpenses,
        isLoading,
      }}
    >
      {children}
    </RecurringExpenseContext.Provider>
  );
}; 