import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, Bank, CreditCard, Category, Income, Expense, Invoice, CategoryGoal,
  InsertUser, InsertBank, InsertCreditCard, InsertCategory, InsertIncome, InsertExpense, InsertInvoice, InsertCategoryGoal,
  COLLECTIONS
} from '../types/firebase-types';

// Utility function to convert Firestore timestamp to Date
const convertTimestamp = (data: any) => {
  if (data.createdAt?.toDate) {
    data.createdAt = data.createdAt.toDate();
  }
  if (data.data?.toDate) {
    data.data = data.data.toDate();
  }
  if (data.dataVencimento?.toDate) {
    data.dataVencimento = data.dataVencimento.toDate();
  }
  return data;
};

// Generic CRUD functions
async function createDocument<T>(collectionName: string, data: any): Promise<T> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp()
  });
  const docSnap = await getDoc(docRef);
  return { id: docRef.id, ...convertTimestamp(docSnap.data()) } as T;
}

async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as T;
  }
  return null;
}

async function getDocumentsByUserId<T>(collectionName: string, userId: string): Promise<T[]> {
  const q = query(
    collection(db, collectionName),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...convertTimestamp(doc.data()) 
  })) as T[];
}

async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
  const docSnap = await getDoc(docRef);
  return { id: docRef.id, ...convertTimestamp(docSnap.data()) } as T;
}

async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

// Firebase Service Class
export class FirebaseService {
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    return createDocument<User>(COLLECTIONS.USERS, user);
  }

  async getUser(id: string): Promise<User | null> {
    return getDocument<User>(COLLECTIONS.USERS, id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamp(doc.data()) } as User;
    }
    return null;
  }

  // Bank operations
  async getBanksByUserId(userId: string): Promise<Bank[]> {
    return getDocumentsByUserId<Bank>(COLLECTIONS.BANKS, userId);
  }

  async getBank(id: string): Promise<Bank | null> {
    return getDocument<Bank>(COLLECTIONS.BANKS, id);
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    return createDocument<Bank>(COLLECTIONS.BANKS, bank);
  }

  async updateBank(id: string, bank: Partial<Bank>): Promise<Bank> {
    return updateDocument<Bank>(COLLECTIONS.BANKS, id, bank);
  }

  async deleteBank(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.BANKS, id);
  }

  // Credit Card operations
  async getCreditCardsByUserId(userId: string): Promise<CreditCard[]> {
    return getDocumentsByUserId<CreditCard>(COLLECTIONS.CREDIT_CARDS, userId);
  }

  async getCreditCard(id: string): Promise<CreditCard | null> {
    return getDocument<CreditCard>(COLLECTIONS.CREDIT_CARDS, id);
  }

  async createCreditCard(creditCard: InsertCreditCard): Promise<CreditCard> {
    return createDocument<CreditCard>(COLLECTIONS.CREDIT_CARDS, creditCard);
  }

  async updateCreditCard(id: string, creditCard: Partial<CreditCard>): Promise<CreditCard> {
    return updateDocument<CreditCard>(COLLECTIONS.CREDIT_CARDS, id, creditCard);
  }

  async deleteCreditCard(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.CREDIT_CARDS, id);
  }

  // Category operations
  async getCategoriesByUserId(userId: string): Promise<Category[]> {
    return getDocumentsByUserId<Category>(COLLECTIONS.CATEGORIES, userId);
  }

  async getCategory(id: string): Promise<Category | null> {
    return getDocument<Category>(COLLECTIONS.CATEGORIES, id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return createDocument<Category>(COLLECTIONS.CATEGORIES, category);
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return updateDocument<Category>(COLLECTIONS.CATEGORIES, id, category);
  }

  async deleteCategory(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.CATEGORIES, id);
  }

  // Income operations
  async getIncomesByUserId(userId: string): Promise<Income[]> {
    return getDocumentsByUserId<Income>(COLLECTIONS.INCOMES, userId);
  }

  async getIncome(id: string): Promise<Income | null> {
    return getDocument<Income>(COLLECTIONS.INCOMES, id);
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    return createDocument<Income>(COLLECTIONS.INCOMES, income);
  }

  async updateIncome(id: string, income: Partial<Income>): Promise<Income> {
    return updateDocument<Income>(COLLECTIONS.INCOMES, id, income);
  }

  async deleteIncome(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.INCOMES, id);
  }

  async getInstallmentIncomesByGroupId(groupId: string): Promise<Income[]> {
    const q = query(
      collection(db, COLLECTIONS.INCOMES),
      where('parcelaGroupId', '==', groupId),
      orderBy('parcelaAtual', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...convertTimestamp(doc.data()) 
    })) as Income[];
  }

  // Expense operations
  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    return getDocumentsByUserId<Expense>(COLLECTIONS.EXPENSES, userId);
  }

  async getExpense(id: string): Promise<Expense | null> {
    return getDocument<Expense>(COLLECTIONS.EXPENSES, id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    return createDocument<Expense>(COLLECTIONS.EXPENSES, expense);
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    return updateDocument<Expense>(COLLECTIONS.EXPENSES, id, expense);
  }

  async deleteExpense(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.EXPENSES, id);
  }

  async getInstallmentExpensesByGroupId(groupId: string): Promise<Expense[]> {
    const q = query(
      collection(db, COLLECTIONS.EXPENSES),
      where('parcelaGroupId', '==', groupId),
      orderBy('parcelaAtual', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...convertTimestamp(doc.data()) 
    })) as Expense[];
  }

  // Invoice operations
  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    return getDocumentsByUserId<Invoice>(COLLECTIONS.INVOICES, userId);
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return getDocument<Invoice>(COLLECTIONS.INVOICES, id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    return createDocument<Invoice>(COLLECTIONS.INVOICES, invoice);
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    return updateDocument<Invoice>(COLLECTIONS.INVOICES, id, invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.INVOICES, id);
  }

  // Category Goal operations
  async getCategoryGoalsByUserId(userId: string): Promise<CategoryGoal[]> {
    return getDocumentsByUserId<CategoryGoal>(COLLECTIONS.CATEGORY_GOALS, userId);
  }

  async getCategoryGoal(id: string): Promise<CategoryGoal | null> {
    return getDocument<CategoryGoal>(COLLECTIONS.CATEGORY_GOALS, id);
  }

  async createCategoryGoal(goal: InsertCategoryGoal): Promise<CategoryGoal> {
    return createDocument<CategoryGoal>(COLLECTIONS.CATEGORY_GOALS, goal);
  }

  async updateCategoryGoal(id: string, goal: Partial<CategoryGoal>): Promise<CategoryGoal> {
    return updateDocument<CategoryGoal>(COLLECTIONS.CATEGORY_GOALS, id, goal);
  }

  async deleteCategoryGoal(id: string): Promise<void> {
    return deleteDocument(COLLECTIONS.CATEGORY_GOALS, id);
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();