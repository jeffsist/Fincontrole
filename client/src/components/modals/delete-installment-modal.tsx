import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Hash } from "lucide-react";

interface DeleteInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteAll: boolean) => void;
  transaction: any;
  type: "income" | "expense";
  isLoading?: boolean;
}

export function DeleteInstallmentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transaction, 
  type,
  isLoading = false 
}: DeleteInstallmentModalProps) {
  const typeLabel = type === "income" ? "receita" : "gasto";
  const typeLabelPlural = type === "income" ? "receitas" : "gastos";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Excluir {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Parcelada
          </DialogTitle>
          <DialogDescription>
            Esta {typeLabel} faz parte de um parcelamento. Como deseja proceder?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da transação */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{transaction?.descricao}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Parcela: {transaction?.parcela}</p>
              <p>Valor: R$ {transaction?.valor?.toFixed(2)}</p>
              {transaction?.totalParcelas && (
                <p>Total de parcelas: {transaction.totalParcelas}</p>
              )}
            </div>
          </div>

          {/* Opções de exclusão */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4 border-orange-200 hover:bg-orange-50"
              onClick={() => onConfirm(false)}
              disabled={isLoading}
            >
              <div className="text-left">
                <div className="font-medium">Excluir apenas esta parcela</div>
                <div className="text-sm text-muted-foreground">
                  Remove apenas a parcela {transaction?.parcela}, mantendo as demais
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4 border-red-200 hover:bg-red-50"
              onClick={() => onConfirm(true)}
              disabled={isLoading}
            >
              <div className="text-left">
                <div className="font-medium text-red-600">Excluir todas as parcelas</div>
                <div className="text-sm text-muted-foreground">
                  Remove todas as {transaction?.totalParcelas} parcelas deste parcelamento
                </div>
              </div>
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}