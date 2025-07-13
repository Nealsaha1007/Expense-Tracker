import { Expense } from '../types';

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    // Ensure the currency code is valid
    const validCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback to basic formatting if Intl.NumberFormat fails
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'EUR' ? '€' : 
                          currency === 'GBP' ? '£' : 
                          currency;
    return `${currencySymbol} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

export const getExpensesByCategory = (expenses: Expense[]): Record<string, number> => {
  return expenses.reduce((categories, expense) => {
    const { category, amount } = expense;
    categories[category] = (categories[category] || 0) + amount;
    return categories;
  }, {} as Record<string, number>);
};

export const getThisMonthExpenses = (expenses: Expense[]): Expense[] => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= firstDayOfMonth;
  });
};

export const getExpensesByDate = (expenses: Expense[]): Record<string, number> => {
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return sortedExpenses.reduce((dates, expense) => {
    const formattedDate = formatDate(expense.date);
    dates[formattedDate] = (dates[formattedDate] || 0) + expense.amount;
    return dates;
  }, {} as Record<string, number>);
}; 