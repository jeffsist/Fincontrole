import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ForecastMonth {
  month: string;
  monthName: string;
  startingBalance?: number;
  income: number;
  expenses: number;
  invoices: number;
  netChange: number;
  endingBalance?: number;
  invoiceDetails?: any[];
  isHistorical?: boolean;
}

interface ForecastData {
  currentBalance: number;
  forecast: ForecastMonth[];
  historyMonths: ForecastMonth[];
  userCreationDate: string;
  navigationStart: string;
  currentMonth: number;
}

export function BalanceForecast() {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const { user } = useAuth();

  const { data: forecastData, isLoading } = useQuery<ForecastData>({
    queryKey: ["/api/forecast"],
    enabled: !!user,
  });

  // Auto-set initial month to current month when data loads
  useEffect(() => {
    if (forecastData && forecastData.forecast.length > 0) {
      // Set initial month to current month (first month in forecast)
      const currentMonthIndex = (forecastData.historyMonths || []).length;
      setSelectedMonthIndex(currentMonthIndex);
    }
  }, [forecastData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-red-600";
    if (balance < 1000) return "text-yellow-600";
    return "text-green-600";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Saldo</CardTitle>
          <CardDescription>Carregando previsão...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Saldo</CardTitle>
          <CardDescription>Erro ao carregar dados da previsão</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Combine historical and forecast data
  const allMonths = [...(forecastData.historyMonths || []), ...(forecastData.forecast || [])];
  const totalMonths = allMonths.length;
  const currentMonthIndex = (forecastData.historyMonths || []).length; // Current month is the first forecast month
  
  const selectedMonth = allMonths[selectedMonthIndex];
  const isCurrentMonth = selectedMonthIndex === currentMonthIndex;
  const isHistoricalMonth = selectedMonthIndex < currentMonthIndex;
  const isFutureMonth = selectedMonthIndex > currentMonthIndex;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Saldo Futuro</CardTitle>
        <CardDescription>
          Projeção de 24 meses baseada no saldo atual dos bancos, receitas pendentes e gastos que afetam o saldo bancário (PIX, transferências, boletos e faturas de cartão)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Saldo Atual (Bancos)</div>
            <div className={`text-xl font-bold ${getBalanceColor(forecastData.currentBalance)}`}>
              {formatCurrency(forecastData.currentBalance)}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Receitas a Receber</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(selectedMonth?.income || 0)}
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Gastos Pendentes</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(selectedMonth?.expenses || 0)}
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Faturas Pendentes</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(selectedMonth?.invoices || 0)}
            </div>
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4">
          <div className="text-sm text-muted-foreground mb-2">Cálculo da Previsão:</div>
          <div className="text-sm font-mono">
            <span className="text-blue-600">{formatCurrency(selectedMonth?.startingBalance || 0)}</span>
            <span className="text-gray-600"> + </span>
            <span className="text-green-600">{formatCurrency(selectedMonth?.income || 0)}</span>
            <span className="text-gray-600"> - </span>
            <span className="text-red-600">{formatCurrency(selectedMonth?.expenses || 0)}</span>
            <span className="text-gray-600"> - </span>
            <span className="text-orange-600">{formatCurrency(selectedMonth?.invoices || 0)}</span>
            <span className="text-gray-600"> = </span>
            <span className={`font-bold ${getBalanceColor(selectedMonth?.endingBalance || 0)}`}>
              {formatCurrency(selectedMonth?.endingBalance || 0)}
            </span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
            disabled={selectedMonthIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{selectedMonth?.monthName}</div>
            <div className="text-sm text-muted-foreground">
              Mês {selectedMonthIndex + 1} de {totalMonths}
            </div>
            <div className="text-xs text-gray-400">
              {isHistoricalMonth ? "Histórico" : isCurrentMonth ? "Atual" : "Previsão"}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonthIndex(Math.min(totalMonths - 1, selectedMonthIndex + 1))}
            disabled={selectedMonthIndex === totalMonths - 1}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Month Details */}
        {selectedMonth && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Receitas a Receber</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(selectedMonth.income)}
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Gastos Bancários</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(selectedMonth.expenses)}
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Faturas Pendentes</div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatCurrency(selectedMonth.invoices)}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Saldo Previsto</div>
                <div className={`text-lg font-semibold flex items-center gap-1 ${getBalanceColor(selectedMonth.endingBalance || 0)}`}>
                  {getChangeIcon(selectedMonth.netChange)}
                  {formatCurrency(selectedMonth.endingBalance || 0)}
                </div>
              </div>
            </div>

            {/* Month Change Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Resumo do Mês</div>
              <div className="flex items-center gap-2">
                <span>Saldo inicial: {formatCurrency(selectedMonth.startingBalance || 0)}</span>
                <span className={selectedMonth.netChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {selectedMonth.netChange >= 0 ? "+" : ""}{formatCurrency(selectedMonth.netChange)}
                </span>
                <span>= {formatCurrency(selectedMonth.endingBalance || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Complete Forecast Table */}
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">Previsão Completa</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-right">Receitas a Receber</TableHead>
                  <TableHead className="text-right">Gastos Bancários</TableHead>
                  <TableHead className="text-right">Faturas Pendentes</TableHead>
                  <TableHead className="text-right">Saldo Previsto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMonths.map((month, index) => {
                  const isHistorical = index < currentMonthIndex;
                  const isCurrent = index === currentMonthIndex;
                  const isSelected = selectedMonthIndex === index;
                  
                  return (
                    <TableRow 
                      key={month.month}
                      className={`${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""} ${
                        isHistorical ? "bg-gray-50 dark:bg-gray-800/30" : ""
                      } ${isCurrent ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {month.monthName}
                          {isHistorical && <Badge variant="outline" className="text-xs">Histórico</Badge>}
                          {isCurrent && <Badge variant="outline" className="text-xs bg-[#b58910]">Atual</Badge>}
                          {!isHistorical && !isCurrent && <Badge variant="outline" className="text-xs bg-[#2d71c4]">Previsão</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(month.startingBalance || 0)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(month.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(month.expenses)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(month.invoices)}</TableCell>
                      <TableCell className={`text-right font-semibold ${getBalanceColor(month.endingBalance || 0)}`}>
                        {formatCurrency(month.endingBalance || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}