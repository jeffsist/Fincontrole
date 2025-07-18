import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, CheckCircle } from "lucide-react";
import { ConfirmReceiptModal } from "@/components/modals/confirm-receipt-modal";

interface PendingReceiptsProps {
  pendingIncomes: any[];
  banks: any[];
  categories: any[];
}

export function PendingReceipts({ pendingIncomes, banks, categories }: PendingReceiptsProps) {
  const [selectedIncome, setSelectedIncome] = useState(null);
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

  const handleConfirmReceipt = (income: any) => {
    setSelectedIncome(income);
    setIsConfirmModalOpen(true);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthIncomes = pendingIncomes.filter(income => {
    const incomeDate = new Date(income.data);
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
  });

  if (currentMonthIncomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-green-500" />
            Recebimentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ArrowUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum recebimento pendente neste mês</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="w-5 h-5 text-green-500" />
          Recebimentos Pendentes - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentMonthIncomes.map((income) => (
            <div key={income.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(income.categoria) }}
                  />
                  <span className="font-medium">{income.descricao}</span>
                  <Badge variant="outline" className="text-xs">
                    {getCategoryName(income.categoria)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-green-600">
                    {formatCurrency(income.valor)}
                  </span>
                  <span>{formatDate(income.data)}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleConfirmReceipt(income)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      {selectedIncome && (
        <ConfirmReceiptModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setSelectedIncome(null);
          }}
          income={selectedIncome}
          banks={banks}
        />
      )}
    </Card>
  );
}