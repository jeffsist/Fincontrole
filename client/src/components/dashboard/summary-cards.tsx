import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowUp, ArrowDown, CreditCard } from "lucide-react";

interface SummaryCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  openInvoices: number;
}

export function SummaryCards({ 
  totalBalance, 
  monthlyIncome, 
  monthlyExpenses, 
  openInvoices 
}: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const cards = [
    {
      title: "Saldo Total",
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: "bg-secondary",
      trend: "+2.5%",
      trendLabel: "vs mês anterior"
    },
    {
      title: "Receitas do Mês",
      value: formatCurrency(monthlyIncome),
      icon: ArrowUp,
      color: "bg-secondary",
      trend: "+5.2%",
      trendLabel: "vs mês anterior"
    },
    {
      title: "Gastos do Mês",
      value: formatCurrency(monthlyExpenses),
      icon: ArrowDown,
      color: "bg-red-500",
      trend: "+1.8%",
      trendLabel: "vs mês anterior"
    },
    {
      title: "Faturas em Aberto",
      value: formatCurrency(openInvoices),
      icon: CreditCard,
      color: "bg-yellow-500",
      trend: "Vence em 5 dias",
      trendLabel: ""
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{card.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground mt-1 truncate">{card.value}</p>
              </div>
              <div className={`${card.color} bg-opacity-10 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`}>
                <card.icon className={`${card.color.replace('bg-', 'text-')} w-4 h-4 sm:w-5 sm:h-5`} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <span className={`${card.color.replace('bg-', 'text-')} text-xs sm:text-sm font-medium`}>
                <ArrowUp className="inline w-3 h-3 mr-1" />
                {card.trend}
              </span>
              {card.trendLabel && (
                <span className="text-muted-foreground text-xs sm:text-sm ml-2 block sm:inline">{card.trendLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
