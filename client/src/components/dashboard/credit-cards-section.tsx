import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard as CreditCardIcon, Receipt } from "lucide-react";
import { CreditCard } from "@shared/firebase-schema";

interface CreditCardsSectionProps {
  creditCards: CreditCard[];
  onAddCreditCard: () => void;
  expenses?: any[];
  invoices?: any[];
  selectedMonth?: string;
}

export function CreditCardsSection({ creditCards, onAddCreditCard, expenses = [], invoices = [], selectedMonth }: CreditCardsSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'bg-blue-600';
      case 'mastercard':
        return 'bg-red-600';
      case 'elo':
        return 'bg-yellow-600';
      case 'american_express':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getBrandIcon = (brand: string) => {
    // In a real app, you'd use proper brand icons
    return brand.toUpperCase();
  };

  const calculateUsedLimit = (cardId: string) => {
    // Calculate total used limit based on unpaid invoices
    const unpaidInvoices = invoices.filter((invoice: any) => 
      invoice.cartaoId === cardId && !invoice.pago
    );
    
    return unpaidInvoices.reduce((sum: number, invoice: any) => sum + invoice.valorTotal, 0);
  };

  const calculateCurrentMonthUsage = (cardId: string) => {
    // Use selected month or current month as fallback
    const targetMonth = selectedMonth || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    
    // Calculate used limit from expenses in target month
    const cardExpenses = expenses.filter((expense: any) => {
      if (expense.cartaoId !== cardId || expense.metodoPagamento !== "credito") {
        return false;
      }
      
      // Filter by target month
      const expenseDate = new Date(expense.data);
      const [year, month] = targetMonth.split('-');
      return expenseDate.getFullYear() === parseInt(year) && 
             expenseDate.getMonth() === parseInt(month) - 1;
    });
    
    return cardExpenses.reduce((sum: number, expense: any) => sum + expense.valor, 0);
  };

  const getCurrentInvoice = (cardId: string) => {
    // Use selected month or current month as fallback
    const targetMonth = selectedMonth || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    
    return invoices.find((invoice: any) => 
      invoice.cartaoId === cardId && 
      invoice.mesAno === targetMonth
    );
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Cartões de Crédito
          </CardTitle>
          <Button 
            onClick={onAddCreditCard}
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-blue-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {creditCards.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum cartão de crédito cadastrado
            </p>
          ) : (
            creditCards.map((card) => {
              const usedLimit = calculateUsedLimit(card.id);
              const availableLimit = card.limite - usedLimit;
              const usagePercentage = (usedLimit / card.limite) * 100;
              const currentInvoice = getCurrentInvoice(card.id);
              
              return (
                <div key={card.id} className="p-3 sm:p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${getBrandColor(card.bandeira)} rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0`}>
                        <CreditCardIcon className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {card.nome || `${card.bandeira.toUpperCase()} **** ${card.final}`}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Vence dia {card.vencimento}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <span className="text-red-500 font-semibold text-sm sm:text-base">
                        {formatCurrency(calculateCurrentMonthUsage(card.id))}
                      </span>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Disponível: {formatCurrency(availableLimit)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Limite utilizado</span>
                      <span className="text-foreground font-medium">
                        {formatCurrency(usedLimit)} / {formatCurrency(card.limite)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          usagePercentage > 70 ? 'bg-red-500' : 
                          usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    
                    {/* Invoice Information and Pay Button */}
                    {currentInvoice && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Receipt className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                              Fatura: {formatCurrency(currentInvoice.valorTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence: {new Date(currentInvoice.dataVencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {!currentInvoice.pago && (
                          <Button
                            size="sm"
                            className="bg-secondary hover:bg-secondary/80 text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 w-full sm:w-auto"
                            onClick={() => {
                              // TODO: Implement pay invoice functionality
                              console.log('Paying invoice:', currentInvoice.id);
                            }}
                          >
                            Pagar Fatura
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
