import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBankModal({ isOpen, onClose }: AddBankModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"corrente" | "poupanca" | "digital">("corrente");
  const [saldo, setSaldo] = useState("");
  const [cor, setCor] = useState("#5e72e4");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addBankMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/banks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Sucesso",
        description: "Conta bancária adicionada com sucesso!",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar conta bancária",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !nome || !saldo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addBankMutation.mutate({
      nome,
      tipo,
      saldo: parseFloat(saldo),
      cor,
    });
  };

  const handleClose = () => {
    setNome("");
    setTipo("corrente");
    setSaldo("");
    setCor("#5e72e4");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Conta Bancária</DialogTitle>
          <DialogDescription>
            Preencha as informações da sua conta bancária para adicionar ao controle financeiro.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Conta</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Banco do Brasil"
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo da Conta</Label>
            <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="digital">Conta Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="saldo">Saldo Inicial</Label>
            <Input
              id="saldo"
              type="number"
              step="0.01"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="cor">Cor Identificadora</Label>
            <Input
              id="cor"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="w-full h-12"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={addBankMutation.isPending}
            >
              {addBankMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
