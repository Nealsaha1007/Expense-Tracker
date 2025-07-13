export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  userId?: string; // Associate expenses with users
}

export type ExpenseCategory = 
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Housing'
  | 'Healthcare'
  | 'Other';

export interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  editExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  isLoading: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  income?: number;
  currency?: string;
  salaryCreditDay?: number; // Day of month when salary is credited (for monthly)
  paymentFrequency?: PaymentFrequency;
  lastPaymentDate?: string; // For biweekly/weekly payments to track
  nextPaymentDate?: string; // Calculated next payment date
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserIncome: (income: number, currency: string) => Promise<void>;
  hasSetIncome: boolean;
}

// Income-related types
export interface IncomeData {
  amount: number;
  currency: string;
  userId: string;
  paymentFrequency: PaymentFrequency;
  salaryCreditDay?: number; // Used for monthly or specific-date
  lastPaymentDate?: string; // For tracking biweekly/weekly payments
  nextPaymentDate?: string; // Calculated next payment date
  updatedAt?: string;
}

export interface IncomeContextType {
  income: number;
  currency: string;
  salaryCreditDay: number | null;
  paymentFrequency: PaymentFrequency;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  updateIncome: (amount: number, currency: string, paymentFrequency?: PaymentFrequency, salaryCreditDay?: number, lastPaymentDate?: string) => Promise<void>;
  isLoading: boolean;
  remainingBalance: number;
  nextPayday: Date | null;
  daysUntilPayday: number | null;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  currency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
}

export interface BudgetContextType {
  budgets: Budget[];
  categoryBudgets: CategoryBudget[];
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  isLoading: boolean;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastProcessed?: string;
  nextDueDate?: string;
  currency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface RecurringExpenseContextType {
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastProcessed' | 'nextDueDate'>) => Promise<void>;
  updateRecurringExpense: (id: string, expense: Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  processRecurringExpenses: () => Promise<{ id: string; description: string; amount: number; }[] | void>;
  isLoading: boolean;
}

// Add a new type for payment frequency
export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly' | 'specific-date'; 