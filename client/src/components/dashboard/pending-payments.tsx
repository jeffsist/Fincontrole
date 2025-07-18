import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, CheckCircle } from "lucide-react";
import { ConfirmPaymentModal } from "@/components/modals/confirm-payment-modal";

interface PendingPaymentsProps {
  pendingExpenses: any[];
  banks: any[];
  creditCards: any[];
  categories: any[];
}

export function PendingPayments({ pendingExpenses, banks, creditCards, categories }: PendingPaymentsProps) {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.nome || "Categoria";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.cor || "#a4b0be";
  };

  const handleConfirmPayment = (expense: any) => {
    setSelectedExpense(expense);
    setIsConfirmModalOpen(true);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = pendingExpenses.filter(expense => {
    const expenseDate = new Date(expense.data);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  if (currentMonthExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-red-500" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ArrowDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum pagamento pendente neste mês</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="w-5 h-5 text-red-500" />
          Pagamentos Pendentes - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentMonthExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-[#616161]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(expense.categoria) }}
                  />
                  <span className="font-medium">{expense.descricao}</span>
                  <Badge variant="outline" className="text-xs">
                    {getCategoryName(expense.categoria)}
                  </Badge>
                  {expense.parcela && (
                    <Badge variant="secondary" className="text-xs">
                      {expense.parcela}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-red-600">
                    -{formatCurrency(expense.valor)}
                  </span>
                  <span>{formatDate(expense.data)}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleConfirmPayment(expense)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      {selectedExpense && (
        <ConfirmPaymentModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          banks={banks}
          creditCards={creditCards}
        />
      )}
    </Card>
  );
}