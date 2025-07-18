import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Building, DollarSign } from "lucide-react";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  banks: any[];
  creditCards: any[];
}

export function ConfirmPaymentModal({ isOpen, onClose, expense, banks, creditCards }: ConfirmPaymentModalProps) {
  const [formData, setFormData] = useState({
    metodoPagamento: "dinheiro",
    cartaoId: "",
    bancoId: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMethods = [
    { value: "dinheiro", label: "Dinheiro", icon: DollarSign },
    { value: "debito", label: "Cartão de Débito", icon: CreditCard },
    { value: "credito", label: "Cartão de Crédito", icon: CreditCard },
    { value: "pix", label: "PIX", icon: DollarSign },
    { value: "transferencia", label: "Transferência", icon: Building },
  ];

  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/expenses/${expense.id}`, {
        ...data,
        status: "pago"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: "Pagamento confirmado com sucesso!",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar pagamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.metodoPagamento) {
      toast({
        title: "Erro",
        description: "Selecione um método de pagamento",
        variant: "destructive",
      });
      return;
    }

    if (formData.metodoPagamento === "credito" && !formData.cartaoId) {
      toast({
        title: "Erro",
        description: "Selecione um cartão de crédito",
        variant: "destructive",
      });
      return;
    }

    if (formData.metodoPagamento !== "credito" && !formData.bancoId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta bancária",
        variant: "destructive",
      });
      return;
    }

    const paymentData: any = {
      metodoPagamento: formData.metodoPagamento,
    };

    if (formData.metodoPagamento === "credito") {
      paymentData.cartaoId = formData.cartaoId;
    } else {
      paymentData.bancoId = formData.bancoId;
    }

    confirmPaymentMutation.mutate(paymentData);
  };

  const handleClose = () => {
    setFormData({
      metodoPagamento: "dinheiro",
      cartaoId: "",
      bancoId: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-500" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Confirme o pagamento de: <strong>{expense?.descricao}</strong>
            <br />
            Valor: <strong>R$ {expense?.valor?.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Método de Pagamento */}
          <div>
            <Label htmlFor="metodoPagamento">Método de Pagamento *</Label>
            <Select value={formData.metodoPagamento} onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value, cartaoId: "", bancoId: "" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Cartão de Crédito (se método for crédito) */}
          {formData.metodoPagamento === "credito" && (
            <div>
              <Label htmlFor="cartaoId">Cartão de Crédito *</Label>
              <Select value={formData.cartaoId} onValueChange={(value) => setFormData({ ...formData, cartaoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {card.nome} •••• {card.final}
                        <Badge variant="outline" className="ml-2">
                          {card.bandeira}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conta Bancária (se método não for crédito) */}
          {formData.metodoPagamento !== "credito" && (
            <div>
              <Label htmlFor="bancoId">Conta Bancária *</Label>
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
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}