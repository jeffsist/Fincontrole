import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bank } from "@shared/firebase-schema";

interface EditBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: Bank | null;
}

export function EditBankModal({ isOpen, onClose, bank }: EditBankModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use bank data directly without state - this prevents the clearing issue
  const formData = bank ? {
    nome: bank.nome || "",
    tipo: bank.tipo || "",
    saldo: bank.saldo?.toString() || "",
    cor: bank.cor || "#3b82f6"
  } : {
    nome: "",
    tipo: "",
    saldo: "",
    cor: "#3b82f6"
  };

  const [localFormData, setLocalFormData] = useState(formData);

  // Sync with bank data when it changes
  useEffect(() => {
    if (bank && isOpen) {
      setLocalFormData({
        nome: bank.nome || "",
        tipo: bank.tipo || "",
        saldo: bank.saldo?.toString() || "",
        cor: bank.cor || "#3b82f6"
      });
      setErrors({});
    }
  }, [bank, isOpen]);

  const updateBankMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!bank) throw new Error("Bank not found");
      return apiRequest("PUT", `/api/banks/${bank.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Sucesso",
        description: "Conta bancária atualizada com sucesso!",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar conta bancária",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!localFormData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    
    if (!localFormData.tipo) {
      newErrors.tipo = "Tipo é obrigatório";
    }
    
    if (!localFormData.saldo.trim()) {
      newErrors.saldo = "Saldo é obrigatório";
    } else if (isNaN(Number(localFormData.saldo))) {
      newErrors.saldo = "Saldo deve ser um número válido";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    updateBankMutation.mutate({
      nome: localFormData.nome.trim(),
      tipo: localFormData.tipo,
      saldo: parseFloat(localFormData.saldo),
      cor: localFormData.cor
    });
  };

  const handleClose = () => {
    setErrors({});
    onClose();
    // Reset form after a delay to avoid interfering with rendering
    setTimeout(() => {
      setLocalFormData({
        nome: "",
        tipo: "",
        saldo: "",
        cor: "#3b82f6"
      });
    }, 100);
  };

  const bankTypes = [
    { value: "corrente", label: "Conta Corrente" },
    { value: "poupanca", label: "Poupança" },
    { value: "digital", label: "Banco Digital" },
    { value: "investimento", label: "Conta Investimento" }
  ];

  const colorOptions = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#10b981", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#6b7280", label: "Cinza" },
    { value: "#14b8a6", label: "Azul Claro" }
  ];

  console.log("Rendering modal with localFormData:", localFormData);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta Bancária</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Conta</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Nubank, Banco do Brasil..."
              value={localFormData.nome}
              onChange={(e) => setLocalFormData({ ...localFormData, nome: e.target.value })}
              className={errors.nome ? "border-red-500" : ""}
            />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Conta</Label>
            <Select value={localFormData.tipo} onValueChange={(value) => setLocalFormData({ ...localFormData, tipo: value })}>
              <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {bankTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldo">Saldo Atual</Label>
            <Input
              id="saldo"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={localFormData.saldo}
              onChange={(e) => setLocalFormData({ ...localFormData, saldo: e.target.value })}
              className={errors.saldo ? "border-red-500" : ""}
            />
            {errors.saldo && <p className="text-sm text-red-500">{errors.saldo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <Select value={localFormData.cor} onValueChange={(value) => setLocalFormData({ ...localFormData, cor: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cor" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={updateBankMutation.isPending} className="flex-1">
              {updateBankMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}