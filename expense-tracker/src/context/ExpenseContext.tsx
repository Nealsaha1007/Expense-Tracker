import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, ExpenseContextType } from '../types';
import { useAuth } from './AuthContext';
import {
  addExpense as addExpenseToFirestore,
  updateExpense as updateExpenseInFirestore,
  deleteExpense as deleteExpenseFromFirestore,
  getUserExpenses
} from '../firebase/services';

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

interface ExpenseProviderProps {
  children: React.ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch expenses when user changes
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        if (user) {
          console.log('Current user ID for fetching expenses:', user.id);
          const userExpenses = await getUserExpenses(user.id);
          console.log('Fetched expenses:', userExpenses);
          setExpenses(userExpenses);
        } else {
          // No user logged in, clear expenses
          console.log('No user logged in, clearing expenses');
          setExpenses([]);
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [user]);

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    
    try {
      console.log('Adding expense to Firestore for user ID:', user.id);
      console.log('Expense data:', expenseData);
      
      // Add userId to the expense data
      const expenseWithUserId = {
        ...expenseData,
        userId: user.id
      };
      
      console.log('Expense with userId:', expenseWithUserId);
      
      // Add to Firestore
      const newExpense = await addExpenseToFirestore(expenseWithUserId);
      console.log('Expense successfully added with ID:', newExpense.id);
      
      // Update local state
      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      await deleteExpenseFromFirestore(id);
      
      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const editExpense = async (id: string, expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    
    try {
      // Make sure userId is preserved
      const expenseWithUserId = {
        ...expenseData,
        userId: user.id
      };
      
      // Update in Firestore
      const updatedExpense = await updateExpenseInFirestore(id, expenseWithUserId);
      
      // Update local state
      setExpenses(prev => 
        prev.map(expense => expense.id === id ? updatedExpense : expense)
      );
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        deleteExpense,
        editExpense,
        isLoading,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}; 