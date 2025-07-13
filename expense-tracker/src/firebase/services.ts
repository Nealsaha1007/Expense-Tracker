import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './config';
import { Expense, IncomeData, Budget, RecurringExpense, PaymentFrequency } from '../types';

// Auth services
export const registerUser = async (name: string, email: string, password: string) => {
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name
      });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<void> => {
  try {
    console.log('Attempting login for:', email);
    
    // Clear previous auth state to prevent persistence issues
    try {
      // First set persistence to session only
      await setPersistence(auth, browserSessionPersistence);
      console.log('Set Firebase persistence to session only');
    } catch (persistenceError) {
      console.error('Error setting auth persistence:', persistenceError);
    }
    
    // Now attempt signin
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful for user:', userCredential.user.uid);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

// Expense services
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  try {
    const expenseRef = await addDoc(collection(db, 'expenses'), expense);
    return {
      id: expenseRef.id,
      ...expense
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (id: string, expense: Omit<Expense, 'id'>) => {
  try {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, expense);
    return {
      id,
      ...expense
    };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string) => {
  try {
    const expenseRef = doc(db, 'expenses', id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const getUserExpenses = async (userId: string) => {
  try {
    console.log('Fetching expenses for user ID:', userId);
    
    // Create a Firestore query for expenses
    const expensesQuery = query(
      collection(db, 'expenses'), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    console.log('Query structure:', JSON.stringify({
      collection: 'expenses',
      filters: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'date', direction: 'desc' }]
    }));
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(expensesQuery);
    
    console.log('Query returned', querySnapshot.size, 'documents');
    
    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Document data:', { id: doc.id, ...data });
      expenses.push({
        id: doc.id,
        ...data
      } as Expense);
    });
    
    console.log(`Found ${expenses.length} expenses for user ${userId}`);
    return expenses;
  } catch (error) {
    console.error("Error getting expenses:", error);
    // Check if this is a missing index error
    if (error instanceof Error && error.message.includes('index')) {
      console.error('Index error detected. You may need to create a composite index in Firebase Console.');
    }
    throw error;
  }
};

// Income services
export const saveUserIncome = async (
  userId: string, 
  income: number, 
  currency: string,
  paymentFrequency: PaymentFrequency = 'monthly',
  salaryCreditDay?: number,
  lastPaymentDate?: string
): Promise<void> => {
  try {
    const userIncomeRef = doc(db, 'userIncome', userId);
    
    // Calculate next payment date
    const nextPaymentDate = calculateNextPaymentDate(
      paymentFrequency,
      salaryCreditDay,
      lastPaymentDate
    );
    
    // Prepare data object
    const incomeData: IncomeData = {
      amount: income,
      currency,
      userId,
      paymentFrequency,
      updatedAt: new Date().toISOString()
    };
    
    // Add conditional fields
    if (salaryCreditDay !== undefined) {
      incomeData.salaryCreditDay = salaryCreditDay;
    }
    
    if (lastPaymentDate) {
      incomeData.lastPaymentDate = lastPaymentDate;
    } else if (['biweekly', 'weekly'].includes(paymentFrequency)) {
      // Set today as the last payment date if none provided for weekly/biweekly
      incomeData.lastPaymentDate = new Date().toISOString();
    }
    
    // Always add the calculated next payment date
    incomeData.nextPaymentDate = nextPaymentDate;
    
    await setDoc(userIncomeRef, incomeData);
    
    console.log('User income saved successfully');
  } catch (error) {
    console.error('Error saving user income:', error);
    throw error;
  }
};

export const getUserIncome = async (userId: string): Promise<IncomeData | null> => {
  try {
    const userIncomeRef = doc(db, 'userIncome', userId);
    const userIncomeSnapshot = await getDoc(userIncomeRef);
    
    if (userIncomeSnapshot.exists()) {
      const data = userIncomeSnapshot.data() as IncomeData;
      
      // Check if we need to recalculate the next payment date
      // This ensures the date is always current even if the app hasn't been used in a while
      const nextPayment = data.nextPaymentDate ? new Date(data.nextPaymentDate) : null;
      const today = new Date();
      
      if (nextPayment && nextPayment < today) {
        // Next payment date is in the past, we need to recalculate
        console.log('Recalculating next payment date');
        
        // Update the last payment date if the payment is due
        let updatedLastPaymentDate = data.lastPaymentDate;
        if (data.paymentFrequency === 'weekly' || data.paymentFrequency === 'biweekly') {
          // For recurring payments, update the last payment date
          updatedLastPaymentDate = data.nextPaymentDate;
        }
        
        const newNextPaymentDate = calculateNextPaymentDate(
          data.paymentFrequency,
          data.salaryCreditDay,
          updatedLastPaymentDate
        );
        
        // Update the document with new payment dates
        await updateDoc(userIncomeRef, {
          nextPaymentDate: newNextPaymentDate,
          lastPaymentDate: updatedLastPaymentDate
        });
        
        // Return the updated data
        return {
          ...data,
          nextPaymentDate: newNextPaymentDate,
          lastPaymentDate: updatedLastPaymentDate
        };
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user income:', error);
    throw error;
  }
};

// Budget services
export const getUserBudgets = async (userId: string) => {
  try {
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(budgetsQuery);
    
    const budgets: Budget[] = [];
    querySnapshot.forEach((doc) => {
      budgets.push({
        id: doc.id,
        ...doc.data()
      } as Budget);
    });
    
    return budgets;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string) => {
  try {
    const timestamp = new Date().toISOString();
    const budgetData = {
      ...budget,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    const budgetRef = await addDoc(collection(db, 'budgets'), budgetData);
    
    return {
      id: budgetRef.id,
      ...budgetData
    } as Budget;
  } catch (error) {
    console.error("Error adding budget:", error);
    throw error;
  }
};

export const updateBudget = async (id: string, budget: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const budgetRef = doc(db, 'budgets', id);
    const budgetDoc = await getDoc(budgetRef);
    
    if (!budgetDoc.exists()) {
      throw new Error(`Budget with ID ${id} does not exist`);
    }
    
    const updatedBudget = {
      ...budget,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(budgetRef, updatedBudget);
    
    return {
      id,
      ...budgetDoc.data(),
      ...updatedBudget
    } as Budget;
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

export const deleteBudget = async (id: string) => {
  try {
    const budgetRef = doc(db, 'budgets', id);
    await deleteDoc(budgetRef);
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};

// Recurring Expense services
export const getUserRecurringExpenses = async (userId: string) => {
  try {
    const recurringExpensesQuery = query(
      collection(db, 'recurringExpenses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(recurringExpensesQuery);
    
    const recurringExpenses: RecurringExpense[] = [];
    querySnapshot.forEach((doc) => {
      recurringExpenses.push({
        id: doc.id,
        ...doc.data()
      } as RecurringExpense);
    });
    
    return recurringExpenses;
  } catch (error) {
    console.error("Error getting recurring expenses:", error);
    throw error;
  }
};

export const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastProcessed' | 'nextDueDate'>, userId: string) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Calculate the next due date based on frequency and start date
    const nextDueDate = calculateNextDueDate(expense.startDate, expense.frequency);
    
    const recurringExpenseData = {
      ...expense,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastProcessed: undefined,
      nextDueDate,
      active: true
    };
    
    const expenseRef = await addDoc(collection(db, 'recurringExpenses'), recurringExpenseData);
    
    return {
      id: expenseRef.id,
      ...recurringExpenseData
    } as RecurringExpense;
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

export const updateRecurringExpense = async (id: string, expense: Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const expenseRef = doc(db, 'recurringExpenses', id);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error(`Recurring expense with ID ${id} does not exist`);
    }
    
    // If frequency or startDate has changed, recalculate nextDueDate
    let nextDueDate = expenseDoc.data().nextDueDate;
    if (expense.frequency || expense.startDate) {
      const frequency = expense.frequency || expenseDoc.data().frequency;
      const startDate = expense.startDate || expenseDoc.data().startDate;
      const lastProcessed = expenseDoc.data().lastProcessed;
      
      nextDueDate = calculateNextDueDate(
        lastProcessed || startDate, 
        frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
      );
    }
    
    const updatedExpense = {
      ...expense,
      updatedAt: new Date().toISOString(),
      nextDueDate
    };
    
    await updateDoc(expenseRef, updatedExpense);
    
    return {
      id,
      ...expenseDoc.data(),
      ...updatedExpense
    } as RecurringExpense;
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

export const deleteRecurringExpense = async (id: string) => {
  try {
    const expenseRef = doc(db, 'recurringExpenses', id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

// Helper to calculate the next due date based on frequency
export const calculateNextDueDate = (baseDate: string, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'): string => {
  const date = new Date(baseDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString();
};

// Process recurring expenses to generate actual expenses
export const processRecurringExpenses = async (userId: string) => {
  try {
    // Get all active recurring expenses for the user
    const recurringExpensesQuery = query(
      collection(db, 'recurringExpenses'),
      where('userId', '==', userId),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(recurringExpensesQuery);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const processed = [];
    
    for (const doc of querySnapshot.docs) {
      const recurringExpense = { id: doc.id, ...doc.data() } as RecurringExpense;
      const nextDueDate = new Date(recurringExpense.nextDueDate || recurringExpense.startDate);
      nextDueDate.setHours(0, 0, 0, 0);
      
      // Check if it's due today or past due
      if (nextDueDate <= today) {
        // Create a new expense
        const expense: Omit<Expense, 'id'> = {
          description: recurringExpense.description,
          amount: recurringExpense.amount,
          category: recurringExpense.category,
          date: new Date().toISOString(),
          currency: recurringExpense.currency,
          userId: recurringExpense.userId
        };
        
        await addExpense(expense);
        
        // Update the recurring expense with new lastProcessed and nextDueDate
        const lastProcessed = new Date().toISOString();
        const nextDueDate = calculateNextDueDate(lastProcessed, recurringExpense.frequency);
        
        // Check if we've reached the end date
        let active = recurringExpense.active;
        if (recurringExpense.endDate) {
          const endDate = new Date(recurringExpense.endDate);
          endDate.setHours(0, 0, 0, 0);
          
          const nextDueDateObj = new Date(nextDueDate);
          nextDueDateObj.setHours(0, 0, 0, 0);
          
          if (nextDueDateObj > endDate) {
            active = false;
          }
        }
        
        await updateDoc(doc.ref, {
          lastProcessed,
          nextDueDate,
          active,
          updatedAt: lastProcessed
        });
        
        processed.push({
          id: recurringExpense.id,
          description: recurringExpense.description,
          amount: recurringExpense.amount
        });
      }
    }
    
    return processed;
  } catch (error) {
    console.error("Error processing recurring expenses:", error);
    throw error;
  }
};

// Add a helper function to calculate next payment date
const calculateNextPaymentDate = (
  frequency: PaymentFrequency,
  salaryCreditDay: number | undefined,
  lastPaymentDate: string | undefined
): string => {
  const today = new Date();
  let nextPaymentDate = new Date();
  
  switch (frequency) {
    case 'monthly':
      // Monthly payment on a specific day
      if (salaryCreditDay !== undefined) {
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), salaryCreditDay);
        
        // If the day has already passed this month, set to next month
        if (today.getDate() > salaryCreditDay) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
      } else {
        // Default to the last day of current month if no specific day set
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      break;
      
    case 'biweekly':
      // Payment every two weeks
      if (lastPaymentDate) {
        const lastPayment = new Date(lastPaymentDate);
        nextPaymentDate = new Date(lastPayment);
        nextPaymentDate.setDate(lastPayment.getDate() + 14);
      } else {
        // If no last payment, set next payment to 2 weeks from today
        nextPaymentDate.setDate(today.getDate() + 14);
      }
      break;
      
    case 'weekly':
      // Payment every week
      if (lastPaymentDate) {
        const lastPayment = new Date(lastPaymentDate);
        nextPaymentDate = new Date(lastPayment);
        nextPaymentDate.setDate(lastPayment.getDate() + 7);
      } else {
        // If no last payment, set next payment to 1 week from today
        nextPaymentDate.setDate(today.getDate() + 7);
      }
      break;
      
    case 'specific-date':
      // Specific date each month, similar to monthly but called differently
      if (salaryCreditDay !== undefined) {
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), salaryCreditDay);
        
        // If the day has already passed this month, set to next month
        if (today.getDate() > salaryCreditDay) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
      } else {
        // Default to today if no specific day
        nextPaymentDate = new Date(today);
      }
      break;
      
    default:
      // Default to monthly
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }
  
  return nextPaymentDate.toISOString();
}; 