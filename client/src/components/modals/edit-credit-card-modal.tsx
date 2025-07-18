import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard: any;
}

export function EditCreditCardModal({ isOpen, onClose, creditCard }: EditCreditCardModalProps) {
  const [nome, setNome] = useState("");
  const [bandeira, setBandeira] = useState<"visa" | "mastercard" | "elo" | "american_express" | "hipercard">("visa");
  const [limite, setLimite] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [fechamento, setFechamento] = useState("");
  const [final, setFinal] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Populate form when modal opens
  useEffect(() => {
    if (creditCard) {
      setNome(creditCard.nome || "");
      setBandeira(creditCard.bandeira || "visa");
      setLimite(creditCard.limite?.toString() || "");
      setVencimento(creditCard.vencimento?.toString() || "");
      setFechamento(creditCard.fechamento?.toString() || "");
      setFinal(creditCard.final || "");
    }
  }, [creditCard]);

  const editCreditCardMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/credit-cards/${creditCard.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito atualizado com sucesso!",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cartão de crédito",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !limite || !vencimento || !fechamento || !final) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (final.length !== 4) {
      toast({
        title: "Erro",
        description: "Os últimos 4 dígitos devem ter exatamente 4 números",
        variant: "destructive",
      });
      return;
    }

    const vencimentoNum = parseInt(vencimento);
    const fechamentoNum = parseInt(fechamento);
    
    if (vencimentoNum < 1 || vencimentoNum > 31) {
      toast({
        title: "Erro",
        description: "Dia de vencimento deve ser entre 1 e 31",
        variant: "destructive",
      });
      return;
    }

    if (fechamentoNum < 1 || fechamentoNum > 31) {
      toast({
        title: "Erro",
        description: "Dia de fechamento deve ser entre 1 e 31",
        variant: "destructive",
      });
      return;
    }

    editCreditCardMutation.mutate({
      nome,
      bandeira,
      limite: parseFloat(limite),
      vencimento: vencimentoNum,
      fechamento: fechamentoNum,
      final,
    });
  };

  const handleClose = () => {
    setNome("");
    setBandeira("visa");
    setLimite("");
    setVencimento("");
    setFechamento("");
    setFinal("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Edite as informações do seu cartão de crédito.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Cartão</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Visa Platinum"
              required
            />
          </div>

          <div>
            <Label htmlFor="bandeira">Bandeira</Label>
            <Select value={bandeira} onValueChange={(value: any) => setBandeira(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="elo">Elo</SelectItem>
                <SelectItem value="american_express">American Express</SelectItem>
                <SelectItem value="hipercard">Hipercard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limite">Limite</Label>
            <Input
              id="limite"
              type="number"
              step="0.01"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="vencimento">Dia de Vencimento</Label>
            <Input
              id="vencimento"
              type="number"
              min="1"
              max="31"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              placeholder="Ex: 10"
              required
            />
          </div>

          <div>
            <Label htmlFor="fechamento">Dia de Fechamento</Label>
            <Input
              id="fechamento"
              type="number"
              min="1"
              max="31"
              value={fechamento}
              onChange={(e) => setFechamento(e.target.value)}
              placeholder="Ex: 5"
              required
            />
          </div>

          <div>
            <Label htmlFor="final">Últimos 4 Dígitos</Label>
            <Input
              id="final"
              type="text"
              maxLength={4}
              value={final}
              onChange={(e) => setFinal(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={editCreditCardMutation.isPending}
            >
              {editCreditCardMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}