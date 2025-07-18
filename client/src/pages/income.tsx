import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowUp, ArrowDown, Filter, Search, Trash2, Hash, Eye, FileImage, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AddIncomeForm } from "@/components/income/add-income-form";
import { EditIncomeModal } from "@/components/income/edit-income-modal";
import { InstallmentIncomeModal } from "@/components/income/installment-income-modal";
import { TransactionActions } from "@/components/common/transaction-actions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Income() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [selectedIncomes, setSelectedIncomes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedInstallmentIncome, setSelectedInstallmentIncome] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incomes = [] } = useQuery({
    queryKey: ["/api/incomes"],
    enabled: !!user,
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["/api/banks"],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Group installment incomes
  const groupedIncomes = incomes.reduce((acc: any[], income: any) => {
    if (income.parcelaGrupoId) {
      // Find existing group
      const existingGroup = acc.find(item => 
        item.isGroup && item.parcelaGrupoId === income.parcelaGrupoId
      );
      
      if (existingGroup) {
        existingGroup.items.push(income);
        existingGroup.totalValue += income.valor;
      } else {
        // Create new group
        acc.push({
          id: income.parcelaGrupoId,
          isGroup: true,
          parcelaGrupoId: income.parcelaGrupoId,
          descricao: income.descricao,
          categoria: income.categoria,
          devedor: income.devedor,
          totalValue: income.valor,
          totalParcelas: income.totalParcelas,
          data: income.data,
          items: [income],
          status: income.status
        });
      }
    } else {
      // Regular income
      acc.push(income);
    }
    return acc;
  }, []);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "recebido":
        return <Badge variant="default" className="bg-secondary">Recebido</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "atrasado":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBankName = (bankId: string) => {
    const bank = banks.find((b: any) => b.id === bankId);
    return bank?.nome || "Banco não encontrado";
  };

  const totalReceived = incomes
    .filter((income: any) => income.status === "recebido")
    .reduce((sum: number, income: any) => sum + income.valor, 0);

  const totalPending = incomes
    .filter((income: any) => income.status === "pendente")
    .reduce((sum: number, income: any) => sum + income.valor, 0);

  // Mutation para deletar receitas em massa
  const deleteIncomesMutation = useMutation({
    mutationFn: async (incomeIds: string[]) => {
      const deletePromises = incomeIds.map(id => 
        apiRequest("DELETE", `/api/incomes/${id}`)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      setSelectedIncomes([]);
      setSelectAll(false);
      toast({
        title: "Sucesso",
        description: "Receitas excluídas com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir receitas. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função para selecionar/deselecionar todas as receitas
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIncomeIds = groupedIncomes.flatMap(item => 
        item.isGroup ? item.items.map((income: any) => income.id) : [item.id]
      );
      setSelectedIncomes(allIncomeIds);
    } else {
      setSelectedIncomes([]);
    }
  };

  // Função para selecionar/deselecionar uma receita individual
  const handleSelectIncome = (incomeId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncomes(prev => [...prev, incomeId]);
    } else {
      setSelectedIncomes(prev => prev.filter(id => id !== incomeId));
      setSelectAll(false);
    }
  };

  // Função para deletar receitas selecionadas
  const handleDeleteSelected = () => {
    if (selectedIncomes.length === 0) return;
    
    if (confirm(`Deseja realmente excluir ${selectedIncomes.length} receita(s) selecionada(s)?`)) {
      deleteIncomesMutation.mutate(selectedIncomes);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-green-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Receitas</h2>
              <p className="text-green-100 mt-1 text-sm sm:text-base">Gerencie suas receitas e ganhos</p>
            </div>
            <Button 
              className="bg-card bg-opacity-20 hover:bg-opacity-30 w-full sm:w-auto"
              onClick={() => setShowAddIncome(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
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
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Recebido</p>
                    <p className="text-lg sm:text-xl font-bold text-secondary truncate">{formatCurrency(totalReceived)}</p>
                  </div>
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-secondary flex-shrink-0 ml-2" />
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
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Receitas</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{incomes.length}</p>
                  </div>
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Média Mensal</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {formatCurrency(incomes.length > 0 ? totalReceived / Math.max(1, incomes.length) : 0)}
                    </p>
                  </div>
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0 ml-2" />
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
                        placeholder="Buscar receitas..."
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
                {incomes.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-incomes"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label 
                        htmlFor="select-all-incomes" 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Selecionar todos ({groupedIncomes.length})
                      </label>
                    </div>
                    
                    {selectedIncomes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedIncomes.length} selecionado(s)
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelected}
                          disabled={deleteIncomesMutation.isPending}
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

          {/* Incomes List */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              {incomes.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma receita cadastrada</p>
                  <Button onClick={() => setShowAddIncome(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Receita
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {groupedIncomes.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                      {item.isGroup ? (
                        // Grouped installment income
                        <div className="p-3">
                          {/* Desktop layout */}
                          <div className="hidden md:flex items-center gap-3 mb-3">
                            <div className="flex items-center">
                              <Checkbox
                                id={`group-${item.id}`}
                                checked={item.items.every((income: any) => selectedIncomes.includes(income.id))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedIncomes(prev => [...prev, ...item.items.map((e: any) => e.id)]);
                                  } else {
                                    setSelectedIncomes(prev => prev.filter(id => !item.items.some((e: any) => e.id === id)));
                                  }
                                }}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                            </div>
                            
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-full">
                                <Users className="w-5 h-5 text-green-600" />
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
                                  <span className="font-medium">Devedor:</span>
                                  <span className="truncate">{item.devedor}</span>
                                  <span className="text-gray-500 dark:text-gray-500">•</span>
                                  <span className="whitespace-nowrap">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="font-bold text-green-600 dark:text-green-400 text-xl">
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
                                  checked={item.items.every((income: any) => selectedIncomes.includes(income.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedIncomes(prev => [...prev, ...item.items.map((e: any) => e.id)]);
                                    } else {
                                      setSelectedIncomes(prev => prev.filter(id => !item.items.some((e: any) => e.id === id)));
                                    }
                                  }}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                              </div>
                              
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-2 rounded-full">
                                  <Users className="w-4 h-4 text-green-600" />
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
                                  <p className="font-bold text-green-600 dark:text-green-400 text-sm">
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
                              Devedor: {item.devedor}
                            </div>
                          </div>
                          
                          {expandedGroups.has(item.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="space-y-2">
                                {item.items.map((income: any) => (
                                  <div key={income.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
                                    {/* Desktop layout */}
                                    <div className="hidden md:flex items-center justify-between p-2">
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex items-center">
                                          <Checkbox
                                            id={`income-${income.id}`}
                                            checked={selectedIncomes.includes(income.id)}
                                            onCheckedChange={(checked) => handleSelectIncome(income.id, checked as boolean)}
                                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                                            {income.parcela}ª parcela
                                          </Badge>
                                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {new Date(income.data).toLocaleDateString('pt-BR')}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        {getStatusBadge(income.status)}
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {formatCurrency(income.valor)}
                                        </span>
                                        <TransactionActions 
                                          transaction={income} 
                                          type="income"
                                          onEdit={(transaction) => {
                                            setEditingIncome(transaction);
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Mobile layout */}
                                    <div className="md:hidden p-2">
                                      <div className="flex items-start gap-2">
                                        <div className="flex items-center pt-1">
                                          <Checkbox
                                            id={`income-mobile-${income.id}`}
                                            checked={selectedIncomes.includes(income.id)}
                                            onCheckedChange={(checked) => handleSelectIncome(income.id, checked as boolean)}
                                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                          />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                {income.parcela}ª
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {getStatusBadge(income.status)}
                                              <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                                                {formatCurrency(income.valor)}
                                              </span>
                                              <TransactionActions 
                                                transaction={income} 
                                                type="income"
                                                onEdit={(transaction) => {
                                                  setEditingIncome(transaction);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                            {new Date(income.data).toLocaleDateString('pt-BR')}
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
                        // Individual income - Mobile responsive layout
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center pt-1">
                              <Checkbox
                                id={`income-${item.id}`}
                                checked={selectedIncomes.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectIncome(item.id, checked as boolean)}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Desktop layout */}
                              <div className="hidden md:flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-full">
                                      <ArrowUp className="w-4 h-4 text-green-500" />
                                    </div>
                                    {item.comprovante && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          window.open(item.comprovante, '_blank');
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
                                      <span className="font-medium">{item.bancoId ? getBankName(item.bancoId) : 'Sem banco'}</span>
                                      <span className="text-gray-500 dark:text-gray-500">•</span>
                                      <span className="whitespace-nowrap">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {getStatusBadge(item.status)}
                                  <div className="text-right">
                                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                                      {formatCurrency(item.valor)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{item.categoria}</p>
                                  </div>
                                  <TransactionActions 
                                    transaction={item} 
                                    type="income"
                                    onEdit={(transaction) => {
                                      setEditingIncome(transaction);
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* Mobile layout - Ultra compact */}
                              <div className="md:hidden">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded-full">
                                      <ArrowUp className="w-3 h-3 text-green-500" />
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
                                          window.open(item.comprovante, '_blank');
                                        }}
                                        className="p-1 h-6 w-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Ver comprovante"
                                      >
                                        <FileImage className="w-3 h-3 text-blue-600" />
                                      </Button>
                                    )}
                                    <TransactionActions 
                                      transaction={item} 
                                      type="income"
                                      onEdit={(transaction) => {
                                        setEditingIncome(transaction);
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
                                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                                      {formatCurrency(item.valor)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate overflow-hidden">
                                  {item.bancoId ? getBankName(item.bancoId) : 'Sem banco'}
                                </div>
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
      
      {/* Add Income Modal */}
      <AddIncomeForm
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        banks={banks}
        categories={categories}
      />

      {/* Edit Income Modal */}
      {editingIncome && (
        <EditIncomeModal
          isOpen={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          income={editingIncome}
          banks={banks}
          categories={categories}
        />
      )}

      {/* Installment Income Modal */}
      {selectedInstallmentIncome && (
        <InstallmentIncomeModal
          isOpen={!!selectedInstallmentIncome}
          onClose={() => setSelectedInstallmentIncome(null)}
          income={selectedInstallmentIncome}
          banks={banks}
        />
      )}
    </div>
  );
}
