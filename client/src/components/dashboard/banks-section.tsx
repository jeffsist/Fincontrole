import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, University } from "lucide-react";
import { Bank } from "@shared/firebase-schema";

interface BanksSectionProps {
  banks: Bank[];
  onAddBank: () => void;
}

export function BanksSection({ banks, onAddBank }: BanksSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Contas Bancárias
          </CardTitle>
          <Button 
            onClick={onAddBank}
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {banks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma conta bancária cadastrada
            </p>
          ) : (
            banks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: bank.cor }}
                  >
                    <University className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bank.nome}</p>
                    <p className="text-sm text-muted-foreground capitalize">{bank.tipo}</p>
                  </div>
                </div>
                <span className="text-foreground font-semibold">
                  {formatCurrency(bank.saldo)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
