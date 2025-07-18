import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, ArrowUp } from "lucide-react";

interface ConfirmReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: any;
  banks: any[];
}

export function ConfirmReceiptModal({ isOpen, onClose, income, banks }: ConfirmReceiptModalProps) {
  const [formData, setFormData] = useState({
    bancoId: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/incomes/${income.id}`, {
        ...data,
        status: "recebido"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Sucesso",
        description: "Recebimento confirmado com sucesso!",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar recebimento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bancoId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta bancária",
        variant: "destructive",
      });
      return;
    }

    confirmReceiptMutation.mutate({
      bancoId: formData.bancoId
    });
  };

  const handleClose = () => {
    setFormData({
      bancoId: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-green-500" />
            Confirmar Recebimento
          </DialogTitle>
          <DialogDescription>
            Confirme o recebimento de: <strong>{income?.descricao}</strong>
            <br />
            Valor: <strong>R$ {income?.valor?.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conta Bancária */}
          <div>
            <Label htmlFor="bancoId">Conta Bancária de Destino *</Label>
            <Select value={formData.bancoId} onValueChange={(value) => setFormData({ ...formData, bancoId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {bank.nome}
                      <Badge variant="outline" className="ml-2">
                        {bank.tipo}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={confirmReceiptMutation.isPending}
            >
              {confirmReceiptMutation.isPending ? "Confirmando..." : "Confirmar Recebimento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}