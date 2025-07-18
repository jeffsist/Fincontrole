import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";

interface RevenueVsExpensesChartProps {
  incomes: any[];
  expenses: any[];
}

export function RevenueVsExpensesChart({ incomes, expenses }: RevenueVsExpensesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6-months");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Generate chart data based on selected period
  const generateChartData = () => {
    const monthsToShow = selectedPeriod === "6-months" ? 6 : 12;
    const currentDate = new Date();
    const data = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Filter incomes for this month
      const monthIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.data);
        const incomeKey = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
        return incomeKey === monthKey && income.status === 'recebido';
      });

      // Filter expenses for this month
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.data);
        const expenseKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        return expenseKey === monthKey && expense.status === 'pago';
      });

      const totalIncomes = monthIncomes.reduce((sum, income) => sum + income.valor, 0);
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.valor, 0);

      data.push({
        month: targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: totalIncomes,
        gastos: totalExpenses,
        saldo: totalIncomes - totalExpenses
      });
    }

    return data;
  };

  const chartData = generateChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <hr className="my-2" />
          <p className="text-sm font-medium">
            Saldo: {formatCurrency(payload[0].payload.saldo)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Receitas vs Gastos
          </CardTitle>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="12-months">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="receitas" 
                name="Receitas" 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="gastos" 
                name="Gastos" 
                fill="#ef4444" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.receitas, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Gastos</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.gastos, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saldo Período</p>
            <p className={`text-lg font-bold ${
              chartData.reduce((sum, item) => sum + item.saldo, 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(chartData.reduce((sum, item) => sum + item.saldo, 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}