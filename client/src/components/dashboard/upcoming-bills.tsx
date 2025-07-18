import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Home, Car } from "lucide-react";

interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "overdue" | "due_soon" | "ok";
  type: "invoice" | "rent" | "financing" | "other";
}

interface UpcomingBillsProps {
  bills: Bill[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return CreditCard;
      case "rent":
        return Home;
      case "financing":
        return Car;
      default:
        return CreditCard;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "invoice":
        return "text-yellow-500";
      case "rent":
        return "text-primary";
      case "financing":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "overdue":
        return "destructive";
      case "due_soon":
        return "secondary";
      case "ok":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "overdue":
        return "Vencido";
      case "due_soon":
        return "Vence em 5 dias";
      case "ok":
        return "Ok";
      default:
        return "Ok";
    }
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Próximos Vencimentos
          </CardTitle>
          <button className="text-primary text-sm font-medium hover:text-primary/80">
            Ver todos
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {bills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum vencimento próximo
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bills.map((bill) => {
                  const Icon = getIcon(bill.type);
                  const iconColor = getIconColor(bill.type);
                  
                  return (
                    <tr key={bill.id}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Icon className={`${iconColor} mr-2 w-4 h-4`} />
                          {bill.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-red-500">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {bill.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getBadgeVariant(bill.status)}>
                          {getStatusText(bill.status)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
