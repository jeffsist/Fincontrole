import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface CategoryGoal {
  id: string;
  categoryId: string;
  type: "income" | "expense";
  monthlyGoal: number;
  isActive: boolean;
  userId: string;
  categoryName: string;
  categoryColor: string;
  categoryType: string;
}

interface GoalsSectionProps {
  currentMonth: Date;
  incomes: any[];
  expenses: any[];
}

export function GoalsSection({ currentMonth, incomes, expenses }: GoalsSectionProps) {
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/category-goals'],
  });

  const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Calculate progress for each goal
  const goalsWithProgress = goals.map((goal: CategoryGoal) => {
    let current = 0;
    const categoryName = goal.categoryName;

    if (goal.type === "income") {
      // Calculate current month income for this category
      current = incomes
        .filter(income => 
          income.categoria === categoryName &&
          income.status === "recebido" &&
          new Date(income.data) >= currentMonthStart &&
          new Date(income.data) <= currentMonthEnd
        )
        .reduce((sum, income) => sum + income.valor, 0);
    } else {
      // Calculate current month expenses for this category
      current = expenses
        .filter(expense => 
          expense.categoria === categoryName &&
          expense.status === "pago" &&
          new Date(expense.data) >= currentMonthStart &&
          new Date(expense.data) <= currentMonthEnd
        )
        .reduce((sum, expense) => sum + expense.valor, 0);
    }

    const progress = (current / goal.monthlyGoal) * 100;
    const remaining = goal.monthlyGoal - current;
    
    return {
      ...goal,
      current,
      progress: Math.min(progress, 100),
      remaining,
      status: progress >= 100 ? "completed" : progress >= 80 ? "warning" : "on-track"
    };
  });

  const activeGoals = goalsWithProgress.filter(goal => goal.isActive);

  if (activeGoals.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma meta configurada ainda
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Configure suas metas financeiras nas configurações
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: goal.categoryColor }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {goal.categoryName}
                  </span>
                  <Badge 
                    variant={goal.type === "income" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {goal.type === "income" ? "Receita" : "Gasto"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {goal.status === "completed" && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                  {goal.status === "warning" && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  {goal.status === "on-track" && (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    R$ {goal.current.toFixed(2)} / R$ {goal.monthlyGoal.toFixed(2)}
                  </span>
                  <span className={`font-medium ${
                    goal.progress >= 100 ? "text-green-600 dark:text-green-400" :
                    goal.progress >= 80 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-blue-600 dark:text-blue-400"
                  }`}>
                    {goal.progress.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {goal.remaining > 0 ? (
                    goal.type === "income" ? 
                      `Faltam R$ ${goal.remaining.toFixed(2)} para atingir a meta` :
                      `Restam R$ ${goal.remaining.toFixed(2)} do orçamento`
                  ) : (
                    goal.type === "income" ? 
                      `Meta atingida! Superou em R$ ${Math.abs(goal.remaining).toFixed(2)}` :
                      `Orçamento estourado em R$ ${Math.abs(goal.remaining).toFixed(2)}`
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}