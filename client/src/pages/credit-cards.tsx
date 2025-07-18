import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AddCreditCardModal } from "@/components/modals/add-credit-card-modal";
import { EditCreditCardModal } from "@/components/modals/edit-credit-card-modal";
import { DeleteCreditCardModal } from "@/components/modals/delete-credit-card-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Edit, Trash2, Receipt, Calendar, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function CreditCards() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false);
  const [editCreditCardModalOpen, setEditCreditCardModalOpen] = useState(false);
  const [deleteCreditCardModalOpen, setDeleteCreditCardModalOpen] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<any>(null);
  const [selectedCardForDelete, setSelectedCardForDelete] = useState<any>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { user } = useAuth();

  const { data: creditCards = [] } = useQuery({
    queryKey: ["/api/credit-cards"],
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

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
      case 'hipercard':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  const totalLimit = creditCards.reduce((sum: number, card: any) => sum + card.limite, 0);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getSelectedCardInvoices = () => {
    if (!selectedCardId) return [];
    return invoices.filter((invoice: any) => 
      invoice.cartaoId === selectedCardId && invoice.mesAno === selectedMonth
    );
  };

  const getSelectedCardExpenses = () => {
    if (!selectedCardId) return [];
    
    // Get the credit card to know its closing date
    const creditCard = creditCards.find((card: any) => card.id === selectedCardId);
    if (!creditCard) return [];
    
    const closingDay = creditCard.fechamento;
    
    // Filter expenses that belong to this invoice based on closing date logic
    const filteredExpenses = expenses.filter((expense: any) => {
      if (expense.cartaoId !== selectedCardId || expense.metodoPagamento !== "credito") {
        return false;
      }
      
      const expenseDate = new Date(expense.data);
      const expenseDay = expenseDate.getDate();
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      // Determine which invoice month this expense should belong to
      let invoiceMonth = expenseMonth;
      let invoiceYear = expenseYear;
      
      // If expense is after closing date, it goes to next month's invoice
      if (expenseDay > closingDay) {
        invoiceMonth++;
        if (invoiceMonth > 11) {
          invoiceMonth = 0;
          invoiceYear++;
        }
      }
      
      // Format the calculated invoice month as YYYY-MM
      const calculatedInvoiceMonth = `${invoiceYear}-${String(invoiceMonth + 1).padStart(2, '0')}`;
      
      // Return true if this expense should be in the selected invoice month
      return calculatedInvoiceMonth === selectedMonth;
    });
    
    return filteredExpenses;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const calculateCardCurrentMonthUsage = (cardId: string) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get the credit card to know its closing date
    const creditCard = creditCards.find((card: any) => card.id === cardId);
    if (!creditCard) return 0;
    
    const closingDay = creditCard.fechamento;
    
    return expenses
      .filter((expense: any) => {
        if (expense.cartaoId !== cardId || expense.metodoPagamento !== "credito") {
          return false;
        }
        
        const expenseDate = new Date(expense.data);
        const expenseDay = expenseDate.getDate();
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();
        
        // Determine which invoice month this expense should belong to
        let invoiceMonth = expenseMonth;
        let invoiceYear = expenseYear;
        
        // If expense is after closing date, it goes to next month's invoice
        if (expenseDay > closingDay) {
          invoiceMonth++;
          if (invoiceMonth > 11) {
            invoiceMonth = 0;
            invoiceYear++;
          }
        }
        
        // Format the calculated invoice month as YYYY-MM
        const calculatedInvoiceMonth = `${invoiceYear}-${String(invoiceMonth + 1).padStart(2, '0')}`;
        
        // Return true if this expense should be in the current month's invoice
        return calculatedInvoiceMonth === currentMonth;
      })
      .reduce((sum: number, expense: any) => sum + expense.valor, 0);
  };

  const calculateCardUsedLimit = (cardId: string) => {
    // Calculate total used limit based on unpaid invoices
    const unpaidInvoices = invoices.filter((invoice: any) => 
      invoice.cartaoId === cardId && !invoice.pago
    );
    
    return unpaidInvoices.reduce((sum: number, invoice: any) => sum + invoice.valorTotal, 0);
  };

  const calculateTotalUsedLimit = () => {
    return creditCards.reduce((total: number, card: any) => {
      return total + calculateCardUsedLimit(card.id);
    }, 0);
  };

  const cardHasExpenses = (cardId: string) => {
    return expenses.some((expense: any) => expense.cartaoId === cardId);
  };

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Cartões de Crédito</h2>
              <p className="text-purple-100 mt-1 text-sm sm:text-base">Gerencie seus cartões e faturas</p>
            </div>
            <Button
              onClick={() => setCreditCardModalOpen(true)}
              className="bg-card bg-opacity-20 hover:bg-opacity-30 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total de Cartões</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{creditCards.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Limite Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatCurrency(totalLimit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Limite Utilizado</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(calculateTotalUsedLimit())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards and Invoices */}
          <div className="space-y-6">
            {/* Credit Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {creditCards.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum cartão de crédito cadastrado</p>
                  <Button onClick={() => setCreditCardModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Cartão
                  </Button>
                </div>
              ) : (
                creditCards.map((card: any) => {
                  const usedLimit = calculateCardUsedLimit(card.id);
                  const availableLimit = card.limite - usedLimit;
                  const usagePercentage = (usedLimit / card.limite) * 100;
                  
                  return (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 ${getBrandColor(card.bandeira)} rounded-lg flex items-center justify-center mr-3`}>
                              <CreditCard className="text-white w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {card.nome}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {card.bandeira.toUpperCase()} **** {card.final}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedCardForEdit(card);
                                setEditCreditCardModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                setSelectedCardForDelete(card);
                                setDeleteCreditCardModalOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Limite Total</span>
                            <span className="font-medium">{formatCurrency(card.limite)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Limite Disponível</span>
                            <span className="font-medium text-secondary">{formatCurrency(availableLimit)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Vencimento</span>
                            <span className="font-medium">Todo dia {card.vencimento}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Fatura Atual</span>
                            <span className="font-medium text-red-600">{formatCurrency(calculateCardCurrentMonthUsage(card.id))}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Limite utilizado</span>
                            <span className="text-foreground font-medium">
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                usagePercentage > 70 ? 'bg-red-500' : 
                                usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              <span>Criado em </span>
                              <span>{new Date(card.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                              className="flex items-center gap-1"
                            >
                              <Receipt className="w-4 h-4" />
                              {selectedCardId === card.id ? 'Ocultar' : 'Ver Faturas'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Selected Card Invoices */}
            {selectedCardId && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Faturas - {creditCards.find((card: any) => card.id === selectedCardId)?.nome}
                    </CardTitle>
                    
                    {/* Month Navigation */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="p-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-md">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm min-w-[120px] text-center">
                          {getMonthName(selectedMonth)}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="p-2"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getSelectedCardInvoices().length === 0 && getSelectedCardExpenses().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhuma fatura ou gasto encontrado para {getMonthName(selectedMonth)}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show invoice if exists */}
                      {getSelectedCardInvoices().map((invoice: any) => (
                        <div key={invoice.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Fatura {getMonthName(selectedMonth)}</span>
                              </div>
                              <Badge variant={invoice.pago ? "default" : "destructive"}>
                                {invoice.pago ? "Pago" : "Pendente"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg text-blue-900">
                                {formatCurrency(invoice.valorTotal)}
                              </div>
                              <div className="text-sm text-blue-600">
                                Vence em {formatDate(invoice.dataVencimento)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Show expenses for the month */}
                      {getSelectedCardExpenses().length > 0 && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-medium text-foreground">
                              Gastos de {getMonthName(selectedMonth)}
                            </h4>
                            <Badge variant="outline" className="ml-auto">
                              {getSelectedCardExpenses().length} {getSelectedCardExpenses().length === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {getSelectedCardExpenses()
                              .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
                              .map((expense: any) => (
                                <div key={expense.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded-md">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{expense.descricao}</span>
                                        {expense.parcela && (
                                          <Badge variant="secondary" className="text-xs">
                                            {expense.parcela}
                                          </Badge>
                                        )}
                                        <Badge 
                                          variant={expense.status === "pago" ? "default" : "destructive"}
                                          className="text-xs"
                                        >
                                          {expense.status === "pago" ? "Pago" : "Pendente"}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(expense.data)}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="font-medium">
                                    {formatCurrency(expense.valor)}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* Total for the month */}
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">Total do mês:</span>
                              <span className="font-bold text-lg text-red-600">
                                {formatCurrency(
                                  getSelectedCardExpenses().reduce((sum: number, expense: any) => sum + expense.valor, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <AddCreditCardModal
        isOpen={creditCardModalOpen}
        onClose={() => setCreditCardModalOpen(false)}
      />

      <EditCreditCardModal
        isOpen={editCreditCardModalOpen}
        onClose={() => {
          setEditCreditCardModalOpen(false);
          setSelectedCardForEdit(null);
        }}
        creditCard={selectedCardForEdit}
      />

      <DeleteCreditCardModal
        isOpen={deleteCreditCardModalOpen}
        onClose={() => {
          setDeleteCreditCardModalOpen(false);
          setSelectedCardForDelete(null);
        }}
        creditCard={selectedCardForDelete}
        hasExpenses={selectedCardForDelete ? cardHasExpenses(selectedCardForDelete.id) : false}
      />
    </div>
  );
}
