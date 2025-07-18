import { useState } from "react";
import { MoreVertical, Edit, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteInstallmentModal } from "@/components/modals/delete-installment-modal";

interface TransactionActionsProps {
  transaction: any;
  type: "income" | "expense";
  onEdit?: (transaction: any) => void;
}

export function TransactionActions({ transaction, type, onEdit }: TransactionActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInstallmentDeleteModal, setShowInstallmentDeleteModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Verificar se é uma transação parcelada
  const isInstallment = transaction?.totalParcelas && transaction?.totalParcelas > 1;

  const deleteTransactionMutation = useMutation({
    mutationFn: async () => {
      const endpoint = type === "income" ? `/api/incomes/${transaction.id}` : `/api/expenses/${transaction.id}`;
      return apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type === "income" ? "incomes" : "expenses"}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: `${type === "income" ? "Receita" : "Gasto"} excluído com sucesso!`,
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Erro ao excluir ${type === "income" ? "receita" : "gasto"}`,
        variant: "destructive",
      });
    },
  });

  const deleteInstallmentMutation = useMutation({
    mutationFn: async (deleteAll: boolean) => {
      const endpoint = type === "income" ? "/api/incomes" : "/api/expenses";
      if (deleteAll) {
        // Excluir todas as parcelas do grupo
        return apiRequest("DELETE", `${endpoint}/installments/${transaction.parcelaGrupoId}`);
      } else {
        // Excluir apenas esta parcela
        return apiRequest("DELETE", `${endpoint}/${transaction.id}`);
      }
    },
    onSuccess: (_, deleteAll) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type === "income" ? "incomes" : "expenses"}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: deleteAll 
          ? `Todas as parcelas foram excluídas com sucesso!`
          : `Parcela excluída com sucesso!`,
      });
      setShowInstallmentDeleteModal(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Erro ao excluir ${type === "income" ? "receita" : "gasto"}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (isInstallment) {
      setShowInstallmentDeleteModal(true);
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleInstallmentDelete = (deleteAll: boolean) => {
    deleteInstallmentMutation.mutate(deleteAll);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-600"
          >
            <Trash className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {type === "income" ? "esta receita" : "este gasto"}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteTransactionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTransactionMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para exclusão de parcelas */}
      <DeleteInstallmentModal
        isOpen={showInstallmentDeleteModal}
        onClose={() => setShowInstallmentDeleteModal(false)}
        onConfirm={handleInstallmentDelete}
        transaction={transaction}
        type={type}
        isLoading={deleteInstallmentMutation.isPending}
      />
    </>
  );
}