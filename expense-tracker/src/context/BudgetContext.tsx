import React, { createContext, useContext, useState, useEffect } from 'react';
import { Budget, BudgetContextType, CategoryBudget } from '../types';
import { useAuth } from './AuthContext';
import { useExpenses } from './ExpenseContext';
import { 
  getUserBudgets,
  addBudget as addBudgetToFirestore,
  updateBudget as updateBudgetInFirestore,
  deleteBudget as deleteBudgetFromFirestore
} from '../firebase/services';
import { getExpensesByCategory, getThisMonthExpenses } from '../utils/helpers';

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: React.ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch budgets when user changes
  useEffect(() => {
    const fetchBudgets = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const userBudgets = await getUserBudgets(user.id);
          setBudgets(userBudgets);
        } else {
          setBudgets([]);
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [user]);

  // Calculate budget progress when expenses or budgets change
  useEffect(() => {
    if (!user || budgets.length === 0) {
      setCategoryBudgets([]);
      return;
    }

    const monthlyExpenses = getThisMonthExpenses(expenses);
    const expensesByCategory = getExpensesByCategory(monthlyExpenses);
    
    const updatedCategoryBudgets = budgets
      .filter(budget => budget.period === 'monthly')
      .map(budget => {
        const spentAmount = expensesByCategory[budget.category] || 0;
        const percentage = (spentAmount / budget.amount) * 100;
        
        return {
          category: budget.category,
          budgetAmount: budget.amount,
          spentAmount,
          percentage: Math.min(percentage, 100) // Cap at 100% for UI purposes
        };
      });
    
    setCategoryBudgets(updatedCategoryBudgets);
  }, [expenses, budgets, user]);

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const newBudget = await addBudgetToFirestore(budgetData, user.id);
      setBudgets(prev => [...prev, newBudget]);
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const updateBudget = async (
    id: string, 
    budgetData: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!user) return;
    
    try {
      const updatedBudget = await updateBudgetInFirestore(id, budgetData);
      setBudgets(prev => 
        prev.map(budget => budget.id === id ? updatedBudget : budget)
      );
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteBudgetFromFirestore(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        categoryBudgets,
        addBudget,
        updateBudget,
        deleteBudget,
        isLoading,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}; 