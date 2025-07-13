import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Expense } from '../types';
import { formatCurrency, formatDate } from './helpers';

// Verify jsPDF is available globally
console.log('jsPDF available:', typeof jsPDF === 'function');

// Add type augmentation for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ReportOptions {
  title: string;
  subtitle?: string;
  currency: string;
  period: string;
  userName: string;
}

export const generateExpenseReport = (expenses: Expense[], options: ReportOptions): jsPDF => {
  try {
    // Create a new document with default settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(options.title, pageWidth / 2, 20, { align: 'center' });

    // Add subtitle
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(options.subtitle, pageWidth / 2, 28, { align: 'center' });
    }

    // Add report info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated for: ${options.userName}`, 14, 40);
    doc.text(`Period: ${options.period}`, 14, 46);
    doc.text(`Currency: ${options.currency}`, 14, 52);
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, 58);
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Expenses: ${formatCurrency(totalAmount, options.currency)}`, pageWidth - 14, 40, { align: 'right' });
    doc.text(`Number of Expenses: ${expenses.length}`, pageWidth - 14, 46, { align: 'right' });
    
    // Expense table
    const tableData = expenses.map(expense => [
      formatDate(expense.date),
      expense.category,
      expense.description,
      formatCurrency(expense.amount, options.currency)
    ]);
    
    // Calculate category totals
    const categoryTotals: { [category: string]: number } = {};
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
    // Sort data by date
    tableData.sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime(); // newest first
    });
    
    // Create expense table
    doc.autoTable({
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: tableData,
      startY: 70,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 135, 245], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 30 },
        3: { halign: 'right' }
      },
      margin: { top: 70 }
    });
    
    // Get the final y position after the table
    const finalY = doc.lastAutoTable?.finalY || 200;
    
    // Add category breakdown
    doc.setFontSize(14);
    doc.text('Category Breakdown', 14, finalY + 20);
    
    const categoryTableData = Object.entries(categoryTotals).map(([category, amount]) => [
      category,
      formatCurrency(amount, options.currency),
      `${((amount / totalAmount) * 100).toFixed(1)}%`
    ]);
    
    // Sort categories by amount (highest first)
    categoryTableData.sort((a, b) => {
      // Parse the currency amounts to numbers for comparison
      const parseAmount = (str: string) => {
        return parseFloat(str.replace(/[^0-9.-]+/g, ''));
      };
      
      const amountA = parseAmount(a[1]);
      const amountB = parseAmount(b[1]);
      return amountB - amountA;
    });
    
    // Create category breakdown table
    doc.autoTable({
      head: [['Category', 'Amount', 'Percentage']],
      body: categoryTableData,
      startY: finalY + 25,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 135, 245], textColor: 255 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
    
    // Add footer
    const footerText = 'Expense Tracker - Generated Report';
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

export const downloadExpenseReport = (
  expenses: Expense[], 
  options: ReportOptions,
  filename: string = 'expense-report.pdf'
): void => {
  try {
    const doc = generateExpenseReport(expenses, options);
    doc.save(filename);
  } catch (error) {
    console.error('Error downloading expense report:', error);
    alert('Error generating the PDF report. Please try again.');
  }
};

export const downloadMonthlyReport = (
  expenses: Expense[], 
  month: number, 
  year: number, 
  options: Omit<ReportOptions, 'period' | 'title'>
): void => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[month];
  const period = `${monthName} ${year}`;
  const title = `Monthly Expense Report`;
  const subtitle = `${monthName} ${year}`;
  
  const reportOptions: ReportOptions = {
    ...options,
    title,
    subtitle,
    period
  };
  
  const filename = `expense-report-${year}-${(month + 1).toString().padStart(2, '0')}.pdf`;
  downloadExpenseReport(expenses, reportOptions, filename);
}; 