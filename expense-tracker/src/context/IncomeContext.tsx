import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getUserIncome, saveUserIncome } from '../firebase/services';
import { useAuth } from './AuthContext';
import { PaymentFrequency } from '../types';

interface IncomeContextType {
  incomeAmount: number;
  currency: string;
  salaryCreditDay: number | null;
  paymentFrequency: PaymentFrequency;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  remainingBalance: number;
  daysUntilPayday: number;
  updateIncome: (amount: number, currency: string, frequency: PaymentFrequency, salaryCreditDay?: number, lastPaymentDate?: string) => Promise<void>;
  resetIncome: () => void;
  fetchIncome: () => Promise<void>;
  isLoading: boolean;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error('useIncome must be used within an IncomeProvider');
  }
  return context;
};

interface IncomeProviderProps {
  children: ReactNode;
}

export const IncomeProvider: React.FC<IncomeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [salaryCreditDay, setSalaryCreditDay] = useState<number | null>(null);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [lastPaymentDate, setLastPaymentDate] = useState<string | null>(null);
  const [nextPaymentDate, setNextPaymentDate] = useState<string | null>(null);
  const [remainingBalance, setRemainingBalance] = useState<number>(0);
  const [daysUntilPayday, setDaysUntilPayday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch income when user changes
  useEffect(() => {
    if (user) {
      fetchIncome();
    } else {
      resetIncome();
    }
  }, [user]);

  // Calculate days until payday and remaining balance whenever income or dates change
  useEffect(() => {
    calculateDaysUntilPayday();
    calculateRemainingBalance();
  }, [incomeAmount, nextPaymentDate]);

  const calculateDaysUntilPayday = () => {
    if (!nextPaymentDate) {
      setDaysUntilPayday(0);
      return;
    }

    const currentDate = new Date();
    const paydayDate = new Date(nextPaymentDate);
    
    // Calculate the difference in days
    const differenceInTime = paydayDate.getTime() - currentDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    setDaysUntilPayday(differenceInDays < 0 ? 0 : differenceInDays);
  };

  const calculateRemainingBalance = () => {
    // For simplicity, just using the income amount as remaining balance
    // In a real app, you would subtract expenses since last payment
    setRemainingBalance(incomeAmount);
  };

  const fetchIncome = async (): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const incomeData = await getUserIncome(user.id);
      if (incomeData) {
        setIncomeAmount(incomeData.amount);
        setCurrency(incomeData.currency);
        
        // Handle payment schedule settings
        setPaymentFrequency(incomeData.paymentFrequency || 'monthly');
        setSalaryCreditDay(incomeData.salaryCreditDay !== undefined ? incomeData.salaryCreditDay : null);
        
        // Handle payment dates
        setLastPaymentDate(incomeData.lastPaymentDate || null);
        setNextPaymentDate(incomeData.nextPaymentDate || null);
        
        // Calculate values based on new data
        calculateDaysUntilPayday();
        calculateRemainingBalance();
      }
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncome = async (
    amount: number, 
    currencyCode: string, 
    frequency: PaymentFrequency,
    creditDay?: number,
    lastPayment?: string
  ): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await saveUserIncome(
        user.id, 
        amount, 
        currencyCode, 
        frequency,
        creditDay,
        lastPayment
      );
      
      // Update local state
      setIncomeAmount(amount);
      setCurrency(currencyCode);
      setPaymentFrequency(frequency);
      setSalaryCreditDay(creditDay !== undefined ? creditDay : null);
      
      if (lastPayment) {
        setLastPaymentDate(lastPayment);
      }
      
      // Fetch updated data from firebase to get the calculated nextPaymentDate
      await fetchIncome();
    } catch (error) {
      console.error('Error updating income:', error);
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
    }
  };

  const resetIncome = () => {
    setIncomeAmount(0);
    setCurrency('USD');
    setSalaryCreditDay(null);
    setPaymentFrequency('monthly');
    setLastPaymentDate(null);
    setNextPaymentDate(null);
    setRemainingBalance(0);
    setDaysUntilPayday(0);
    setIsLoading(false);
  };

  const value = {
    incomeAmount,
    currency,
    salaryCreditDay,
    paymentFrequency,
    lastPaymentDate,
    nextPaymentDate,
    remainingBalance,
    daysUntilPayday,
    updateIncome,
    resetIncome,
    fetchIncome,
    isLoading,
  };

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  );
};

export default IncomeContext; 