import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Download, Filter, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RevenueVsExpensesChart } from "@/components/charts/revenue-vs-expenses-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { BalanceForecast } from "@/components/reports/balance-forecast";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { user } = useAuth();

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ["/api/incomes"],
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filter data based on selected period
  const getFilteredData = () => {
    const currentDate = new Date();
    let startDate: Date;
    let endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of current month

    switch (selectedPeriod) {
      case "current-month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case "last-month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        break;
      case "last-3-months":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
        break;
      case "last-6-months":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
        break;
      case "current-year":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }

    // Filter incomes by period (both paid and pending)
    const filteredIncomes = incomes.filter((income: any) => {
      const incomeDate = new Date(income.data);
      const isInPeriod = incomeDate >= startDate && incomeDate <= endDate;
      return isInPeriod;
    });

    // Filter expenses by period (both paid and pending)
    let filteredExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.data);
      const isInPeriod = expenseDate >= startDate && expenseDate <= endDate;
      return isInPeriod;
    });

    // Apply category filter if not "all"
    if (selectedCategory !== "all") {
      filteredExpenses = filteredExpenses.filter((expense: any) => expense.categoria === selectedCategory);
    }

    return { filteredIncomes, filteredExpenses };
  };

  const { filteredIncomes, filteredExpenses } = getFilteredData();
  

  
  // Calculate separate totals for received and pending amounts
  const totalIncomesReceived = filteredIncomes
    .filter((income: any) => income.status === 'recebido')
    .reduce((sum: number, income: any) => sum + income.valor, 0);
  
  const totalIncomesPending = filteredIncomes
    .filter((income: any) => income.status === 'pendente')
    .reduce((sum: number, income: any) => sum + income.valor, 0);
  
  const totalExpensesPaid = filteredExpenses
    .filter((expense: any) => expense.status === 'pago')
    .reduce((sum: number, expense: any) => sum + expense.valor, 0);
  
  const totalExpensesPending = filteredExpenses
    .filter((expense: any) => expense.status === 'pendente')
    .reduce((sum: number, expense: any) => sum + expense.valor, 0);

  const totalIncomes = totalIncomesReceived + totalIncomesPending;
  const totalExpenses = totalExpensesPaid + totalExpensesPending;
  const balance = totalIncomes - totalExpenses;

  // Group filtered expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc: any, expense: any) => {
    const category = expense.categoria || 'Sem categoria';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.valor;
    return acc;
  }, {});

  const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount: amount as number,
    percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  // Group filtered expenses by payment method
  const expensesByPaymentMethod = filteredExpenses.reduce((acc: any, expense: any) => {
    const method = expense.metodoPagamento || 'Outros';
    if (!acc[method]) {
      acc[method] = 0;
    }
    acc[method] += expense.valor;
    return acc;
  }, {});

  const paymentMethodData = Object.entries(expensesByPaymentMethod).map(([method, amount]) => ({
    method,
    amount: amount as number,
    percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

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

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Relatórios</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Análise detalhada das suas finanças</p>
            </div>
            <Button className="bg-card bg-opacity-20 hover:bg-opacity-30 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Período
                  </label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mês Atual</SelectItem>
                      <SelectItem value="last-month">Mês Anterior</SelectItem>
                      <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                      <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                      <SelectItem value="current-year">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Force re-render by updating state
                      setSelectedPeriod(prev => prev);
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recebido</p>
                    <p className="text-2xl font-bold text-secondary">{formatCurrency(totalIncomesReceived)}</p>
                  </div>
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-lg">
                    <TrendingUp className="text-secondary w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalIncomesPending)}</p>
                  </div>
                  <div className="bg-blue-500 bg-opacity-10 p-3 rounded-lg">
                    <CalendarDays className="text-blue-500 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pago</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpensesPaid)}</p>
                  </div>
                  <div className="bg-red-500 bg-opacity-10 p-3 rounded-lg">
                    <TrendingDown className="text-red-500 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpensesPending)}</p>
                  </div>
                  <div className="bg-orange-500 bg-opacity-10 p-3 rounded-lg">
                    <CalendarDays className="text-orange-500 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-secondary' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className={`${balance >= 0 ? 'bg-secondary' : 'bg-red-500'} bg-opacity-10 p-3 rounded-lg`}>
                    <DollarSign className={`${balance >= 0 ? 'text-secondary' : 'text-red-500'} w-6 h-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transações</p>
                    <p className="text-2xl font-bold text-foreground">{filteredIncomes.length + filteredExpenses.length}</p>
                  </div>
                  <div className="bg-muted bg-opacity-10 p-3 rounded-lg">
                    <PieChart className="text-muted-foreground w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CategoryPieChart 
              expenses={filteredExpenses} 
              categories={categories} 
              title={`Gastos por Categoria - ${selectedPeriod === 'current-month' ? 'Mês Atual' : selectedPeriod === 'last-month' ? 'Mês Anterior' : selectedPeriod === 'last-3-months' ? 'Últimos 3 Meses' : selectedPeriod === 'last-6-months' ? 'Últimos 6 Meses' : 'Ano Atual'}`} 
            />
            <CategoryPieChart 
              expenses={filteredExpenses.map(exp => ({ ...exp, categoria: exp.metodoPagamento }))} 
              categories={[
                { id: "dinheiro", nome: "Dinheiro", cor: "#3b82f6" },
                { id: "debito", nome: "Débito", cor: "#ef4444" },
                { id: "credito", nome: "Crédito", cor: "#10b981" },
                { id: "pix", nome: "PIX", cor: "#f59e0b" },
                { id: "transferencia", nome: "Transferência", cor: "#8b5cf6" },
                { id: "boleto", nome: "Boleto", cor: "#06b6d4" }
              ]}
              title={`Gastos por Método de Pagamento - ${selectedPeriod === 'current-month' ? 'Mês Atual' : selectedPeriod === 'last-month' ? 'Mês Anterior' : selectedPeriod === 'last-3-months' ? 'Últimos 3 Meses' : selectedPeriod === 'last-6-months' ? 'Últimos 6 Meses' : 'Ano Atual'}`} 
            />
          </div>

          {/* Monthly Trend */}
          <div className="mb-8">
            <RevenueVsExpensesChart incomes={filteredIncomes} expenses={filteredExpenses} />
          </div>

          {/* Balance Forecast */}
          <BalanceForecast />
        </div>
      </main>
    </div>
  );
}
