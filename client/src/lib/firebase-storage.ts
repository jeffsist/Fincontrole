import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { nanoid } from 'nanoid';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface Bank {
  id: string;
  userId: string;
  nome: string;
  tipo: string;
  saldo: number;
  cor: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  nome: string;
  tipo: string;
  cor: string;
  createdAt: Date;
}

export interface Income {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  bancoId?: string;
  recorrente: boolean;
  frequencia?: string;
  status: string;
  comprovante?: string;
  parcela?: string;
  numeroParcela?: number;
  totalParcelas?: number;
  parcelaGrupoId?: string;
  valorTotal?: number;
  devedor?: string;
  observacoes?: string;
  dataRecebimento?: Date;
  createdAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  nome: string;
  final: string;
  limite: number;
  fechamento: number;
  vencimento: number;
  cor: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  cartaoId: string;
  mesAno: string;
  valorTotal: number;
  dataVencimento: Date;
  status: string;
  pago: boolean;
  createdAt: Date;
}

export interface CategoryGoal {
  id: string;
  userId: string;
  categoryId: string;
  type: string;
  monthlyGoal: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  metodoPagamento: string;
  cartaoId?: string;
  bancoId?: string;
  parcela?: string;
  numeroParcela?: number;
  totalParcelas?: number;
  parcelaGrupoId?: string;
  valorTotal?: number;
  recorrente: boolean;
  frequencia?: string;
  status: string;
  comprovante?: string;
  observacoes?: string;
  createdAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  nome: string;
  final: string;
  limite: number;
  fechamento: number;
  vencimento: number;
  cor: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  cartaoId: string;
  mesAno: string;
  valorTotal: number;
  dataVencimento: Date;
  status: string;
  pago: boolean;
  createdAt: Date;
}

export interface CategoryGoal {
  id: string;
  userId: string;
  categoryId: string;
  type: string;
  monthlyGoal: number;
  isActive: boolean;
  createdAt: Date;
}

// Helper function to convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

// Helper function to convert data for Firestore
function prepareForFirestore(data: any): any {
  const prepared = { ...data };
  
  // Convert Date objects to Firestore timestamps
  Object.keys(prepared).forEach(key => {
    if (prepared[key] instanceof Date) {
      prepared[key] = Timestamp.fromDate(prepared[key]);
    }
  });
  
  // Add createdAt if not present
  if (!prepared.createdAt) {
    prepared.createdAt = serverTimestamp();
  }
  
  return prepared;
}

// Helper function to convert data from Firestore
function convertFromFirestore(data: any): any {
  const converted = { ...data };
  
  // Convert Firestore timestamps to Date objects
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key].seconds) {
      converted[key] = timestampToDate(converted[key]);
    }
  });
  
  return converted;
}

export class FirebaseStorage {
  // User operations
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const userId = userData.email.replace(/[^a-zA-Z0-9]/g, '_');
    const userRef = doc(db, 'users', userId);
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date()
    };
    
    // Use setDoc to create or update user
    await setDoc(userRef, prepareForFirestore(user), { merge: true });
    
    return user;
  }

  async getUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    return {
      id: userDoc.id,
      ...convertFromFirestore(data)
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
    return this.getUser(userId);
  }

  // Bank operations
  async getBanksByUserId(userId: string): Promise<Bank[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'banks'));
      const allBanks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      })) as Bank[];
      
      // Filter by userId on the client side
      const userBanks = allBanks.filter(bank => bank.userId === userId);
      return userBanks;
    } catch (error) {
      console.error('Firebase: Error getting banks:', error);
      throw error;
    }
  }

  async createBank(bankData: Omit<Bank, 'id' | 'createdAt'>): Promise<Bank> {
    const docRef = await addDoc(collection(db, 'banks'), prepareForFirestore({
      ...bankData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...bankData,
      createdAt: new Date()
    };
  }

  async updateBank(id: string, bankData: Partial<Bank>): Promise<Bank> {
    const bankRef = doc(db, 'banks', id);
    await updateDoc(bankRef, prepareForFirestore(bankData));
    
    const updated = await getDoc(bankRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as Bank;
  }

  async deleteBank(id: string): Promise<void> {
    await deleteDoc(doc(db, 'banks', id));
  }

  // Category operations
  async getCategoriesByUserId(userId: string): Promise<Category[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const allCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      })) as Category[];
      
      // Filter by userId on the client side
      const userCategories = allCategories.filter(category => category.userId === userId);
      return userCategories;
    } catch (error) {
      console.error('Firebase: Error getting categories:', error);
      throw error;
    }
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const docRef = await addDoc(collection(db, 'categories'), prepareForFirestore({
      ...categoryData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...categoryData,
      createdAt: new Date()
    };
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, prepareForFirestore(categoryData));
    
    const updated = await getDoc(categoryRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', id));
  }

  // Income operations
  async getIncomesByUserId(userId: string): Promise<Income[]> {
    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', userId),
      orderBy('data', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Income[];
  }

  async createIncome(incomeData: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
    const docRef = await addDoc(collection(db, 'incomes'), prepareForFirestore({
      ...incomeData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...incomeData,
      createdAt: new Date()
    };
  }

  async updateIncome(id: string, incomeData: Partial<Income>): Promise<Income> {
    const incomeRef = doc(db, 'incomes', id);
    await updateDoc(incomeRef, prepareForFirestore(incomeData));
    
    const updated = await getDoc(incomeRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as Income;
  }

  async deleteIncome(id: string): Promise<void> {
    await deleteDoc(doc(db, 'incomes', id));
  }

  // Expense operations
  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Expense[];
    
    // Sort by date on client side to avoid Firebase index requirement
    return expenses.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  async createExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const docRef = await addDoc(collection(db, 'expenses'), prepareForFirestore({
      ...expenseData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...expenseData,
      createdAt: new Date()
    };
  }

  async updateExpense(id: string, expenseData: Partial<Expense>): Promise<Expense> {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, prepareForFirestore(expenseData));
    
    const updated = await getDoc(expenseRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as Expense;
  }

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, 'expenses', id));
  }

  // Credit Card operations
  async getCreditCardsByUserId(userId: string): Promise<CreditCard[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'creditCards'));
      const allCards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      })) as CreditCard[];
      
      // Filter by userId on the client side
      const userCards = allCards.filter(card => card.userId === userId);
      return userCards;
    } catch (error) {
      console.error('Firebase: Error getting credit cards:', error);
      throw error;
    }
  }

  async createCreditCard(creditCardData: Omit<CreditCard, 'id' | 'createdAt'>): Promise<CreditCard> {
    const docRef = await addDoc(collection(db, 'creditCards'), prepareForFirestore({
      ...creditCardData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...creditCardData,
      createdAt: new Date()
    };
  }

  async updateCreditCard(id: string, creditCardData: Partial<CreditCard>): Promise<CreditCard> {
    const creditCardRef = doc(db, 'creditCards', id);
    await updateDoc(creditCardRef, prepareForFirestore(creditCardData));
    
    const updated = await getDoc(creditCardRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as CreditCard;
  }

  async deleteCreditCard(id: string): Promise<void> {
    await deleteDoc(doc(db, 'creditCards', id));
  }

  // Invoice operations
  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    const q = query(
      collection(db, 'invoices'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as Invoice[];
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const docRef = await addDoc(collection(db, 'invoices'), prepareForFirestore({
      ...invoiceData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...invoiceData,
      createdAt: new Date()
    };
  }

  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoiceRef = doc(db, 'invoices', id);
    await updateDoc(invoiceRef, prepareForFirestore(invoiceData));
    
    const updated = await getDoc(invoiceRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as Invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await deleteDoc(doc(db, 'invoices', id));
  }

  // Category Goal operations
  async getCategoryGoalsByUserId(userId: string): Promise<CategoryGoal[]> {
    const q = query(
      collection(db, 'categoryGoals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    })) as CategoryGoal[];
  }

  async createCategoryGoal(goalData: Omit<CategoryGoal, 'id' | 'createdAt'>): Promise<CategoryGoal> {
    const docRef = await addDoc(collection(db, 'categoryGoals'), prepareForFirestore({
      ...goalData,
      createdAt: new Date()
    }));
    
    return {
      id: docRef.id,
      ...goalData,
      createdAt: new Date()
    };
  }

  async updateCategoryGoal(id: string, goalData: Partial<CategoryGoal>): Promise<CategoryGoal> {
    const goalRef = doc(db, 'categoryGoals', id);
    await updateDoc(goalRef, prepareForFirestore(goalData));
    
    const updated = await getDoc(goalRef);
    return {
      id: updated.id,
      ...convertFromFirestore(updated.data())
    } as CategoryGoal;
  }

  async deleteCategoryGoal(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categoryGoals', id));
  }

  // Initialize default categories for new users
  async initializeDefaultCategories(userId: string): Promise<void> {
    // Check if user already has categories
    const existingCategories = await this.getCategoriesByUserId(userId);
    if (existingCategories.length > 0) {
      console.log('User already has categories, skipping initialization');
      return;
    }

    const defaultCategories = [
      { nome: 'Alimentação', tipo: 'despesa', cor: '#FF6B6B' },
      { nome: 'Transporte', tipo: 'despesa', cor: '#4ECDC4' },
      { nome: 'Moradia', tipo: 'despesa', cor: '#45B7D1' },
      { nome: 'Lazer', tipo: 'despesa', cor: '#FFA726' },
      { nome: 'Saúde', tipo: 'despesa', cor: '#AB47BC' },
      { nome: 'Educação', tipo: 'despesa', cor: '#66BB6A' },
      { nome: 'Salário', tipo: 'receita', cor: '#4CAF50' },
      { nome: 'Freelance', tipo: 'receita', cor: '#2196F3' },
      { nome: 'Investimentos', tipo: 'receita', cor: '#FF9800' },
      { nome: 'Outros', tipo: 'receita', cor: '#9C27B0' }
    ];

    const batch = writeBatch(db);
    
    defaultCategories.forEach(category => {
      const docRef = doc(collection(db, 'categories'));
      batch.set(docRef, prepareForFirestore({
        ...category,
        userId,
        createdAt: new Date()
      }));
    });

    await batch.commit();
    console.log('Default categories initialized for user:', userId);
  }
}

export const firebaseStorage = new FirebaseStorage();