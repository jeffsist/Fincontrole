// Firebase Types - Sistema exclusivo para GitHub Pages + Firebase
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Bank {
  id: string;
  userId: string;
  nome: string;
  tipo: 'corrente' | 'poupanca' | 'digital';
  saldo: number;
  cor: string;
  createdAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  nome: string;
  final: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'american-express';
  limite: number;
  fechamento: number;
  vencimento: number;
  cor: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  createdAt: Date;
}

export interface Income {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  data: Date;
  categoryId: string;
  bankId: string;
  isParcela: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
  parcelaGroupId?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  data: Date;
  categoryId: string;
  bankId?: string;
  creditCardId?: string;
  comprovante?: string;
  isParcela: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
  parcelaGroupId?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  creditCardId: string;
  mesReferencia: string;
  valor: number;
  dataVencimento: Date;
  paga: boolean;
  createdAt: Date;
}

export interface CategoryGoal {
  id: string;
  userId: string;
  categoryId: string;
  valor: number;
  mesReferencia: string;
  createdAt: Date;
}

// Insert types para formulários
export type InsertUser = Omit<User, 'id' | 'createdAt'>;
export type InsertBank = Omit<Bank, 'id' | 'createdAt'>;
export type InsertCreditCard = Omit<CreditCard, 'id' | 'createdAt'>;
export type InsertCategory = Omit<Category, 'id' | 'createdAt'>;
export type InsertIncome = Omit<Income, 'id' | 'createdAt'>;
export type InsertExpense = Omit<Expense, 'id' | 'createdAt'>;
export type InsertInvoice = Omit<Invoice, 'id' | 'createdAt'>;
export type InsertCategoryGoal = Omit<CategoryGoal, 'id' | 'createdAt'>;

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  BANKS: 'banks',
  CREDIT_CARDS: 'creditCards',
  CATEGORIES: 'categories',
  INCOMES: 'incomes',
  EXPENSES: 'expenses',
  INVOICES: 'invoices',
  CATEGORY_GOALS: 'categoryGoals',
} as const;