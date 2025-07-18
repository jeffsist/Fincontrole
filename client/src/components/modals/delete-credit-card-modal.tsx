import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CreditCard, Trash2 } from "lucide-react";

interface DeleteCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard: any;
  hasExpenses: boolean;
}

export function DeleteCreditCardModal({ isOpen, onClose, creditCard, hasExpenses }: DeleteCreditCardModalProps) {
  const [deleteOption, setDeleteOption] = useState<"card-only" | "card-and-expenses">("card-only");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteCreditCardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/credit-cards/${creditCard.id}?deleteExpenses=${deleteOption === "card-and-expenses"}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: deleteOption === "card-and-expenses" 
          ? "Cartão e gastos excluídos com sucesso!" 
          : "Cartão excluído com sucesso! Os gastos foram mantidos.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir cartão de crédito",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteCreditCardMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Excluir Cartão de Crédito
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Escolha como proceder com os gastos associados a este cartão.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Card Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">{creditCard?.nome}</p>
              <p className="text-sm text-muted-foreground">
                {creditCard?.bandeira?.toUpperCase()} **** {creditCard?.final}
              </p>
            </div>
          </div>

          {hasExpenses && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">O que fazer com os gastos deste cartão?</Label>
              
              <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as any)}>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="card-only" id="card-only" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="card-only" className="font-medium cursor-pointer">
                      Manter gastos (Recomendado)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Os gastos serão mantidos com o nome "Cartão Excluído - {creditCard?.final}". 
                      Isso preserva o histórico financeiro.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 border rounded-lg border-red-200 bg-red-50">
                  <RadioGroupItem value="card-and-expenses" id="card-and-expenses" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="card-and-expenses" className="font-medium cursor-pointer text-red-700">
                      Excluir tudo
                    </Label>
                    <p className="text-sm text-red-600">
                      Remove o cartão e TODOS os gastos associados permanentemente. 
                      Esta opção apagará seu histórico financeiro.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {!hasExpenses && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Este cartão não possui gastos associados. Pode ser excluído sem impacto no histórico.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              variant="destructive"
              className="flex-1"
              disabled={deleteCreditCardMutation.isPending}
            >
              {deleteCreditCardMutation.isPending ? (
                "Excluindo..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}