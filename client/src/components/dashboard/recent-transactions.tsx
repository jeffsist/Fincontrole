import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, CreditCard, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  category: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "income":
        return ArrowUp;
      case "expense":
        return ArrowDown;
      case "credit":
        return CreditCard;
      default:
        return ShoppingCart;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-secondary bg-secondary";
      case "expense":
        return "text-red-500 bg-red-500";
      case "credit":
        return "text-yellow-500 bg-yellow-500";
      default:
        return "text-red-500 bg-red-500";
    }
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Transações Recentes
          </CardTitle>
          <Link href="/expenses" className="text-primary text-sm font-medium hover:text-primary/80">
            Ver todas
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma transação encontrada
            </p>
          ) : (
            transactions.map((transaction) => {
              const Icon = getIcon(transaction.type);
              const colorClass = getIconColor(transaction.type);
              
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <div className={`${colorClass} bg-opacity-10 p-2 rounded-lg mr-3`}>
                      <Icon className={`${colorClass.split(' ')[0]} w-4 h-4`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-secondary' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
