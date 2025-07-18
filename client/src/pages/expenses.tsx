import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowDown, Filter, Search, Trash2, Eye, FileImage, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { EditExpenseModal } from "@/components/expenses/edit-expense-modal";
import { TransactionActions } from "@/components/common/transaction-actions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


export default function Expenses() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });



  const { data: banks = [] } = useQuery({
    queryKey: ["/api/banks"],
    enabled: !!user,
  });

  const { data: creditCards = [] } = useQuery({
    queryKey: ["/api/credit-cards"],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Group installment expenses
  const groupedExpenses = expenses.reduce((acc: any[], expense: any) => {
    if (expense.parcelaGrupoId) {
      // Find existing group
      const existingGroup = acc.find(item => 
        item.isGroup && item.parcelaGrupoId === expense.parcelaGrupoId
      );
      
      if (existingGroup) {
        existingGroup.items.push(expense);
        existingGroup.totalValue += expense.valor;
      } else {
        // Create new group
        acc.push({
          id: expense.parcelaGrupoId,
          isGroup: true,
          parcelaGrupoId: expense.parcelaGrupoId,
          descricao: expense.descricao,
          categoria: expense.categoria,
          metodoPagamento: expense.metodoPagamento,
          cartaoId: expense.cartaoId,
          bancoId: expense.bancoId,
          totalValue: expense.valor,
          totalParcelas: expense.totalParcelas,
          data: expense.data,
          items: [expense],
          status: expense.status
        });
      }
    } else {
      // Regular expense
      acc.push(expense);
    }
    return acc;
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge variant="default" className="bg-secondary">Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "atrasado":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      "dinheiro": "Dinheiro",
      "debito": "Débito",
      "credito": "Crédito",
      "pix": "PIX",
      "transferencia": "Transferência",
      "boleto": "Boleto",
      "pendente": "Pendente"
    };
    return methods[method] || method;
  };

  const getBankName = (bankId: string) => {
    const bank = banks.find((b: any) => b.id === bankId);
    return bank?.nome || "";
  };

  const getCreditCardName = (cardId: string) => {
    const card = creditCards.find((c: any) => c.id === cardId);
    return card ? `${card.nome} **** ${card.final}` : "";
  };

  const totalPaid = expenses
    .filter((expense: any) => expense.status === "pago")
    .reduce((sum: number, expense: any) => sum + expense.valor, 0);

  const totalPending = expenses
    .filter((expense: any) => expense.status === "pendente")
    .reduce((sum: number, expense: any) => sum + expense.valor, 0);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Mutation para deletar despesas em massa
  const deleteExpensesMutation = useMutation({
    mutationFn: async (expenseIds: string[]) => {
      const deletePromises = expenseIds.map(id => 
        apiRequest("DELETE", `/api/expenses/${id}`)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setSelectedExpenses([]);
      setSelectAll(false);
      toast({
        title: "Sucesso",
        description: "Despesas excluídas com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir despesas. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função para selecionar/deselecionar todas as despesas
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allExpenseIds = groupedExpenses.flatMap(item => 
        item.isGroup ? item.items.map((expense: any) => expense.id) : [item.id]
      );
      setSelectedExpenses(allExpenseIds);
    } else {
      setSelectedExpenses([]);
    }
  };

  // Função para selecionar/deselecionar uma despesa individual
  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
      setSelectAll(false);
    }
  };

  // Função para deletar despesas selecionadas
  const handleDeleteSelected = () => {
    if (selectedExpenses.length === 0) return;
    
    if (confirm(`Deseja realmente excluir ${selectedExpenses.length} despesa(s) selecionada(s)?`)) {
      deleteExpensesMutation.mutate(selectedExpenses);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Despesas</h2>
              <p className="text-red-100 mt-1 text-sm sm:text-base">Gerencie suas despesas e gastos</p>
            </div>
            <Button 
              className="bg-card bg-opacity-20 hover:bg-opacity-30 w-full sm:w-auto"
              onClick={() => setShowAddExpense(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Gasto
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Pago</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600 truncate">{formatCurrency(totalPaid)}</p>
                  </div>
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendente</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-600 truncate">{formatCurrency(totalPending)}</p>
                  </div>
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Gastos</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{expenses.length}</p>
                  </div>
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Média por Gasto</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {formatCurrency(expenses.length > 0 ? totalPaid / Math.max(1, expenses.length) : 0)}
                    </p>
                  </div>
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar gastos..."
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>
                
                {/* Controles de Seleção */}
                {expenses.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label 
                        htmlFor="select-all" 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Selecionar todos ({groupedExpenses.length})
                      </label>
                    </div>
                    
                    {selectedExpenses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedExpenses.length} selecionado(s)
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelected}
                          disabled={deleteExpensesMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir Selecionados
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum gasto cadastrado</p>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Gasto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {groupedExpenses.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                      {item.isGroup ? (
                        // Grouped installment expense
                        <div className="p-3">
                          {/* Desktop layout */}
                          <div className="hidden md:flex items-center gap-3 mb-3">
                            <div className="flex items-center">
                              <Checkbox
                                id={`group-${item.id}`}
                                checked={item.items.every((expense: any) => selectedExpenses.includes(expense.id))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedExpenses(prev => [...prev, ...item.items.map((e: any) => e.id)]);
                                  } else {
                                    setSelectedExpenses(prev => prev.filter(id => !item.items.some((e: any) => e.id === id)));
                                  }
                                }}
                                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                              />
                            </div>
                            
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-3 rounded-full">
                                <CreditCard className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                                    {item.descricao}
                                  </h3>
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800 whitespace-nowrap">
                                    {item.items.length}/{item.totalParcelas} parcelas
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
                                  <span className="font-medium">{getPaymentMethodText(item.metodoPagamento)}</span>
                                  {item.metodoPagamento === "credito" && item.cartaoId && (
                                    <>
                                      <span className="text-gray-500 dark:text-gray-500">•</span>
                                      <span className="truncate">{getCreditCardName(item.cartaoId)}</span>
                                    </>
                                  )}
                                  {item.metodoPagamento !== "credito" && item.bancoId && (
                                    <>
                                      <span className="text-gray-500 dark:text-gray-500">•</span>
                                      <span className="truncate">{getBankName(item.bancoId)}</span>
                                    </>
                                  )}
                                  <span className="text-gray-500 dark:text-gray-500">•</span>
                                  <span className="whitespace-nowrap">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="font-bold text-red-600 dark:text-red-400 text-xl">
                                  {formatCurrency(item.totalValue)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.categoria}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGroup(item.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <ArrowDown className={`w-4 h-4 transition-transform ${expandedGroups.has(item.id) ? 'rotate-180' : ''}`} />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile layout */}
                          <div className="md:hidden">
                            <div className="flex items-start gap-2 mb-2">
                              <div className="flex items-center pt-1">
                                <Checkbox
                                  id={`group-mobile-${item.id}`}
                                  checked={item.items.every((expense: any) => selectedExpenses.includes(expense.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedExpenses(prev => [...prev, ...item.items.map((e: any) => e.id)]);
                                    } else {
                                      setSelectedExpenses(prev => prev.filter(id => !item.items.some((e: any) => e.id === id)));
                                    }
                                  }}
                                  className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                />
                              </div>
                              
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-2 rounded-full">
                                  <CreditCard className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                      {item.descricao}
                                    </h3>
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800 text-xs whitespace-nowrap">
                                      {item.items.length}/{item.totalParcelas}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.categoria}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right">
                                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                                    {formatCurrency(item.totalValue)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleGroup(item.id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <ArrowDown className={`w-3 h-3 transition-transform ${expandedGroups.has(item.id) ? 'rotate-180' : ''}`} />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate ml-6">
                              {getPaymentMethodText(item.metodoPagamento)}
                              {item.metodoPagamento === "credito" && item.cartaoId && (
                                <span> • {getCreditCardName(item.cartaoId)}</span>
                              )}
                              {item.metodoPagamento !== "credito" && item.bancoId && (
                                <span> • {getBankName(item.bancoId)}</span>
                              )}
                            </div>
                          </div>
                          
                          {expandedGroups.has(item.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="space-y-2">
                                {item.items.map((expense: any) => (
                                  <div key={expense.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
                                    {/* Desktop layout */}
                                    <div className="hidden md:flex items-center justify-between p-2">
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex items-center">
                                          <Checkbox
                                            id={`expense-${expense.id}`}
                                            checked={selectedExpenses.includes(expense.id)}
                                            onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                                            {expense.parcela}ª parcela
                                          </Badge>
                                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {new Date(expense.data).toLocaleDateString('pt-BR')}
                                          </span>
                                          {expense.comprovante && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setViewingReceipt(expense.comprovante);
                                                setShowReceiptModal(true);
                                              }}
                                              className="p-1 h-6 w-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                              title="Ver comprovante"
                                            >
                                              <FileImage className="w-3 h-3 text-blue-600" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        {getStatusBadge(expense.status)}
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                          {formatCurrency(expense.valor)}
                                        </span>
                                        <TransactionActions 
                                          transaction={expense} 
                                          type="expense"
                                          onEdit={(transaction) => {
                                            setEditingExpense(transaction);
                                            setShowEditModal(true);
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Mobile layout */}
                                    <div className="md:hidden p-2">
                                      <div className="flex items-start gap-2">
                                        <div className="flex items-center pt-1">
                                          <Checkbox
                                            id={`expense-mobile-${expense.id}`}
                                            checked={selectedExpenses.includes(expense.id)}
                                            onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                          />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                {expense.parcela}ª
                                              </Badge>
                                              {expense.comprovante && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    setViewingReceipt(expense.comprovante);
                                                    setShowReceiptModal(true);
                                                  }}
                                                  className="p-1 h-5 w-5 hover:bg-blue-50 dark:hover:bg-blue-900/20 ml-[-4px] mr-[-4px]"
                                                  title="Ver comprovante"
                                                >
                                                  <FileImage className="w-3 h-3 text-blue-600" />
                                                </Button>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {getStatusBadge(expense.status)}
                                              <span className="font-medium text-red-600 dark:text-red-400 text-sm">
                                                {formatCurrency(expense.valor)}
                                              </span>
                                              <TransactionActions 
                                                transaction={expense} 
                                                type="expense"
                                                onEdit={(transaction) => {
                                                  setEditingExpense(transaction);
                                                  setShowEditModal(true);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                            {new Date(expense.data).toLocaleDateString('pt-BR')}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Individual expense - Mobile responsive layout
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center pt-1">
                              <Checkbox
                                id={`expense-${item.id}`}
                                checked={selectedExpenses.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectExpense(item.id, checked as boolean)}
                                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Desktop layout */}
                              <div className="hidden md:flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full">
                                      <ArrowDown className="w-4 h-4 text-red-500" />
                                    </div>
                                    {item.comprovante && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setViewingReceipt(item.comprovante);
                                          setShowReceiptModal(true);
                                        }}
                                        className="p-1.5 h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Ver comprovante"
                                      >
                                        <FileImage className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {item.descricao}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">{getPaymentMethodText(item.metodoPagamento)}</span>
                                      {item.metodoPagamento === "credito" && item.cartaoId && (
                                        <>
                                          <span className="text-gray-500 dark:text-gray-500">•</span>
                                          <span className="truncate">{getCreditCardName(item.cartaoId)}</span>
                                        </>
                                      )}
                                      {item.metodoPagamento !== "credito" && item.bancoId && (
                                        <>
                                          <span className="text-gray-500 dark:text-gray-500">•</span>
                                          <span className="truncate">{getBankName(item.bancoId)}</span>
                                        </>
                                      )}
                                      <span className="text-gray-500 dark:text-gray-500">•</span>
                                      <span className="whitespace-nowrap">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {getStatusBadge(item.status)}
                                  <div className="text-right">
                                    <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                                      {formatCurrency(item.valor)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{item.categoria}</p>
                                  </div>
                                  <TransactionActions 
                                    transaction={item} 
                                    type="expense"
                                    onEdit={(transaction) => {
                                      setEditingExpense(transaction);
                                      setShowEditModal(true);
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* Mobile layout - Ultra compact */}
                              <div className="md:hidden">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-1.5 rounded-full">
                                      <ArrowDown className="w-3 h-3 text-red-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm overflow-hidden">
                                        {item.descricao}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {item.comprovante && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setViewingReceipt(item.comprovante);
                                          setShowReceiptModal(true);
                                        }}
                                        className="p-1 h-6 w-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Ver comprovante"
                                      >
                                        <FileImage className="w-3 h-3 text-blue-600" />
                                      </Button>
                                    )}
                                    <TransactionActions 
                                      transaction={item} 
                                      type="expense"
                                      onEdit={(transaction) => {
                                        setEditingExpense(transaction);
                                        setShowEditModal(true);
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
                                    {getStatusBadge(item.status)}
                                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                                      {item.categoria}
                                    </span>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                                      {formatCurrency(item.valor)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {getPaymentMethodText(item.metodoPagamento)}
                                </div>
                                
                                {((item.metodoPagamento === "credito" && item.cartaoId) || 
                                  (item.metodoPagamento !== "credito" && item.bancoId)) && (
                                  <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate overflow-hidden">
                                      {item.metodoPagamento === "credito" && item.cartaoId 
                                        ? getCreditCardName(item.cartaoId)
                                        : getBankName(item.bancoId)
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Add Expense Modal */}
      <AddExpenseForm
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        banks={banks}
        creditCards={creditCards}
        categories={categories}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        banks={banks}
        creditCards={creditCards}
        categories={categories}
      />

      {/* Receipt Viewer Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="receipt-description">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
            <p id="receipt-description" className="sr-only">
              Modal para visualizar o comprovante da transação
            </p>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {viewingReceipt && (
              <img
                src={viewingReceipt}
                alt="Comprovante"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', e);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280">Erro ao carregar imagem</text></svg>';
                }}
              />
            )}
          </div>
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReceiptModal(false)}
            >
              Fechar
            </Button>
            {viewingReceipt && (
              <Button
                onClick={() => window.open(viewingReceipt, '_blank')}
              >
                Abrir em Nova Aba
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
