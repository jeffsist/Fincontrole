import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const [endpoint, ...params] = queryKey as [string, ...any[]];
        
        // Map endpoints to Firebase API client methods
        switch (endpoint) {
          case '/api/banks':
            return apiClient.getBanks();
          case '/api/categories':
            return apiClient.getCategories();
          case '/api/incomes':
            return apiClient.getIncomes();
          case '/api/expenses':
            return apiClient.getExpenses();
          case '/api/credit-cards':
            return apiClient.getCreditCards();
          case '/api/invoices':
            return apiClient.getInvoices();
          case '/api/category-goals':
            return apiClient.getCategoryGoals();
          default:
            throw new Error(`Unsupported endpoint: ${endpoint}`);
        }
      },
    },
  },
});

export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<any> {
  // Map API endpoints to Firebase client methods
  switch (method.toLowerCase()) {
    case 'post':
      switch (endpoint) {
        case '/api/banks':
          return apiClient.createBank(body);
        case '/api/categories':
          return apiClient.createCategory(body);
        case '/api/incomes':
          return apiClient.createIncome(body);
        case '/api/expenses':
          return apiClient.createExpense(body);
        case '/api/credit-cards':
          return apiClient.createCreditCard(body);
        case '/api/invoices':
          return apiClient.createInvoice(body);
        case '/api/category-goals':
          return apiClient.createCategoryGoal(body);
        case '/api/expenses/bulk-delete':
          return apiClient.bulkDeleteExpenses(body.ids);
        case '/api/incomes/bulk-delete':
          return apiClient.bulkDeleteIncomes(body.ids);
        case '/api/auth/user':
          return apiClient.createUser(body);
        default:
          throw new Error(`Unsupported POST endpoint: ${endpoint}`);
      }
    
    case 'patch':
    case 'put':
      const id = endpoint.split('/').pop();
      const baseEndpoint = endpoint.replace(`/${id}`, '');
      
      switch (baseEndpoint) {
        case '/api/banks':
          return apiClient.updateBank(id!, body);
        case '/api/categories':
          return apiClient.updateCategory(id!, body);
        case '/api/incomes':
          return apiClient.updateIncome(id!, body);
        case '/api/expenses':
          return apiClient.updateExpense(id!, body);
        case '/api/credit-cards':
          return apiClient.updateCreditCard(id!, body);
        case '/api/invoices':
          return apiClient.updateInvoice(id!, body);
        case '/api/category-goals':
          return apiClient.updateCategoryGoal(id!, body);
        default:
          throw new Error(`Unsupported PATCH endpoint: ${endpoint}`);
      }
    
    case 'delete':
      const deleteId = endpoint.split('/').pop();
      const deleteBaseEndpoint = endpoint.replace(`/${deleteId}`, '');
      
      switch (deleteBaseEndpoint) {
        case '/api/banks':
          return apiClient.deleteBank(deleteId!);
        case '/api/categories':
          return apiClient.deleteCategory(deleteId!);
        case '/api/incomes':
          return apiClient.deleteIncome(deleteId!);
        case '/api/expenses':
          return apiClient.deleteExpense(deleteId!);
        case '/api/credit-cards':
          return apiClient.deleteCreditCard(deleteId!);
        case '/api/invoices':
          return apiClient.deleteInvoice(deleteId!);
        case '/api/category-goals':
          return apiClient.deleteCategoryGoal(deleteId!);
        default:
          throw new Error(`Unsupported DELETE endpoint: ${endpoint}`);
      }
    
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}
