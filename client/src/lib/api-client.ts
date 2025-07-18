import { firebaseService } from '../services/firebase-service';
import { auth } from './firebase';

// Get current user ID
function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

// API Client for Firebase operations
export const apiClient = {
  // User operations
  async createUser(userData: { email: string; displayName?: string }) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const user = await firebaseService.createUser({
      email: userData.email,
      displayName: userData.displayName || 'Usuário'
    });
    
    // Initialize default categories for new user
    try {
      await apiClient.initializeDefaultCategories(userId);
    } catch (error) {
      console.log('Categories may already exist:', error);
    }
    
    return user;
  },

  async getUser(userId: string) {
    return firebaseService.getUser(userId);
  },

  async getUserByEmail(email: string) {
    return firebaseService.getUserByEmail(email);
  },

  // Bank operations
  async getBanks() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    console.log('Getting banks for user:', userId);
    try {
      const result = await firebaseService.getBanksByUserId(userId);
      console.log('Banks retrieved:', result);
      return result;
    } catch (error) {
      console.error('Error getting banks:', error);
      throw error;
    }
  },

  async createBank(bankData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    console.log('Creating bank for user:', userId, bankData);
    try {
      const result = await firebaseService.createBank({ ...bankData, userId });
      console.log('Bank created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating bank:', error);
      throw error;
    }
  },

  async updateBank(id: string, bankData: any) {
    return firebaseService.updateBank(id, bankData);
  },

  async deleteBank(id: string) {
    return firebaseService.deleteBank(id);
  },

  // Category operations
  async getCategories() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.getCategoriesByUserId(userId);
  },

  async createCategory(categoryData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.createCategory({ ...categoryData, userId });
  },

  async updateCategory(id: string, categoryData: any) {
    return firebaseService.updateCategory(id, categoryData);
  },

  async deleteCategory(id: string) {
    return firebaseService.deleteCategory(id);
  },

  // Income operations
  async getIncomes() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.getIncomesByUserId(userId);
  },

  async createIncome(incomeData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.createIncome({ ...incomeData, userId });
  },

  async updateIncome(id: string, incomeData: any) {
    return firebaseService.updateIncome(id, incomeData);
  },

  async deleteIncome(id: string) {
    return firebaseService.deleteIncome(id);
  },

  // Expense operations
  async getExpenses() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.getExpensesByUserId(userId);
  },

  async createExpense(expenseData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.createExpense({ ...expenseData, userId });
  },

  async updateExpense(id: string, expenseData: any) {
    return firebaseService.updateExpense(id, expenseData);
  },

  async deleteExpense(id: string) {
    return firebaseService.deleteExpense(id);
  },

  // Credit Card operations
  async getCreditCards() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    console.log('Getting credit cards for user:', userId);
    const result = await firebaseService.getCreditCardsByUserId(userId);
    console.log('Credit cards retrieved:', result);
    return result;
  },

  async createCreditCard(cardData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    console.log('Creating credit card for user:', userId, cardData);
    try {
      const result = await firebaseService.createCreditCard({ ...cardData, userId });
      console.log('Credit card created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating credit card:', error);
      throw error;
    }
  },

  async updateCreditCard(id: string, cardData: any) {
    return firebaseService.updateCreditCard(id, cardData);
  },

  async deleteCreditCard(id: string) {
    return firebaseService.deleteCreditCard(id);
  },

  // Invoice operations
  async getInvoices() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.getInvoicesByUserId(userId);
  },

  async createInvoice(invoiceData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.createInvoice({ ...invoiceData, userId });
  },

  async updateInvoice(id: string, invoiceData: any) {
    return firebaseService.updateInvoice(id, invoiceData);
  },

  async deleteInvoice(id: string) {
    return firebaseService.deleteInvoice(id);
  },

  // Category Goal operations
  async getCategoryGoals() {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.getCategoryGoalsByUserId(userId);
  },

  async createCategoryGoal(goalData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return firebaseService.createCategoryGoal({ ...goalData, userId });
  },

  async updateCategoryGoal(id: string, goalData: any) {
    return firebaseService.updateCategoryGoal(id, goalData);
  },

  async deleteCategoryGoal(id: string) {
    return firebaseService.deleteCategoryGoal(id);
  },

  // Bulk operations
  async bulkDeleteExpenses(ids: string[]) {
    const promises = ids.map(id => this.deleteExpense(id));
    await Promise.all(promises);
    return { success: true };
  },

  async bulkDeleteIncomes(ids: string[]) {
    const promises = ids.map(id => this.deleteIncome(id));
    await Promise.all(promises);
    return { success: true };
  },

  // Initialize default categories for new user
  async initializeDefaultCategories(userId: string) {
    const defaultCategories = [
      // Receitas
      { nome: 'Salário', tipo: 'receita', cor: '#22c55e', icone: 'banknote' },
      { nome: 'Freelance', tipo: 'receita', cor: '#3b82f6', icone: 'laptop' },
      { nome: 'Investimentos', tipo: 'receita', cor: '#8b5cf6', icone: 'trending-up' },
      { nome: 'Outros', tipo: 'receita', cor: '#6b7280', icone: 'plus' },
      
      // Despesas
      { nome: 'Alimentação', tipo: 'despesa', cor: '#ef4444', icone: 'utensils' },
      { nome: 'Transporte', tipo: 'despesa', cor: '#f59e0b', icone: 'car' },
      { nome: 'Moradia', tipo: 'despesa', cor: '#06b6d4', icone: 'home' },
      { nome: 'Lazer', tipo: 'despesa', cor: '#ec4899', icone: 'gamepad-2' },
      { nome: 'Saúde', tipo: 'despesa', cor: '#10b981', icone: 'heart' },
      { nome: 'Educação', tipo: 'despesa', cor: '#6366f1', icone: 'book' },
      { nome: 'Outros', tipo: 'despesa', cor: '#6b7280', icone: 'more-horizontal' },
    ];

    const promises = defaultCategories.map(category => 
      firebaseService.createCategory({ ...category, userId })
    );

    await Promise.all(promises);
    return { success: true };
  }
};