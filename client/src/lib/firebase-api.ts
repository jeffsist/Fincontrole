import { FirebaseStorage } from './firebase-storage';
import { useAuth } from '../hooks/use-auth';

// Singleton instance of FirebaseStorage
const firebaseStorage = new FirebaseStorage();

// Helper to ensure user is authenticated
const getAuthenticatedUserId = (): string => {
  const user = useAuth();
  if (!user.user?.uid) {
    throw new Error('User not authenticated');
  }
  return user.user.uid;
};

// Bank operations
export const bankAPI = {
  async getAll() {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.getBanksByUserId(userId);
  },
  
  async create(bankData: any) {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.createBank({ ...bankData, userId });
  },
  
  async update(id: string, bankData: any) {
    return firebaseStorage.updateBank(id, bankData);
  },
  
  async delete(id: string) {
    return firebaseStorage.deleteBank(id);
  }
};

// Category operations
export const categoryAPI = {
  async getAll() {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.getCategoriesByUserId(userId);
  },
  
  async create(categoryData: any) {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.createCategory({ ...categoryData, userId });
  },
  
  async update(id: string, categoryData: any) {
    return firebaseStorage.updateCategory(id, categoryData);
  },
  
  async delete(id: string) {
    return firebaseStorage.deleteCategory(id);
  }
};

// Income operations
export const incomeAPI = {
  async getAll() {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.getIncomesByUserId(userId);
  },
  
  async create(incomeData: any) {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.createIncome({ ...incomeData, userId });
  },
  
  async update(id: string, incomeData: any) {
    return firebaseStorage.updateIncome(id, incomeData);
  },
  
  async delete(id: string) {
    return firebaseStorage.deleteIncome(id);
  }
};

// Expense operations
export const expenseAPI = {
  async getAll() {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.getExpensesByUserId(userId);
  },
  
  async create(expenseData: any) {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.createExpense({ ...expenseData, userId });
  },
  
  async update(id: string, expenseData: any) {
    return firebaseStorage.updateExpense(id, expenseData);
  },
  
  async delete(id: string) {
    return firebaseStorage.deleteExpense(id);
  }
};

// Credit Card operations
export const creditCardAPI = {
  async getAll() {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.getCreditCardsByUserId(userId);
  },
  
  async create(creditCardData: any) {
    const userId = getAuthenticatedUserId();
    return firebaseStorage.createCreditCard({ ...creditCardData, userId });
  },
  
  async update(id: string, creditCardData: any) {
    return firebaseStorage.updateCreditCard(id, creditCardData);
  },
  
  async delete(id: string) {
    return firebaseStorage.deleteCreditCard(id);
  }
};

// Export storage instance for direct use
export { firebaseStorage };