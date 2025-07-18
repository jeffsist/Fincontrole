import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const editExpenseSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  metodoPagamento: z.string().min(1, "Método de pagamento é obrigatório"),
  bancoId: z.string().nullable(),
  cartaoId: z.string().nullable(),
  status: z.enum(["pendente", "pago"]),
  observacoes: z.string().nullable(),
});

type EditExpenseForm = z.infer<typeof editExpenseSchema>;

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  banks: any[];
  creditCards: any[];
  categories: any[];
}

export function EditExpenseModal({ isOpen, onClose, expense, banks, creditCards, categories }: EditExpenseModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditExpenseForm>({
    resolver: zodResolver(editExpenseSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      data: "",
      categoria: "",
      metodoPagamento: "",
      bancoId: null,
      cartaoId: null,
      status: "pendente",
      observacoes: null,
    },
  });

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      const expenseDate = new Date(expense.data);
      const formattedDate = expenseDate.toISOString().split('T')[0];
      
      form.reset({
        descricao: expense.descricao || "",
        valor: expense.valor || 0,
        data: formattedDate,
        categoria: expense.categoria || "",
        metodoPagamento: expense.metodoPagamento || "",
        bancoId: expense.bancoId || null,
        cartaoId: expense.cartaoId || null,
        status: expense.status || "pendente",
        observacoes: expense.observacoes || null,
      });
      setSelectedPaymentMethod(expense.metodoPagamento || "");
    }
  }, [expense, form]);

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: EditExpenseForm) => {
      const response = await apiRequest("PUT", `/api/expenses/${expense.id}`, {
        ...data,
        valor: Number(data.valor),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: "Gasto atualizado com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar gasto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditExpenseForm) => {
    updateExpenseMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSelectedPaymentMethod("");
    onClose();
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    form.setValue("metodoPagamento", method);
    
    // Reset bank and card fields when payment method changes
    if (method === "credito") {
      form.setValue("bancoId", null);
    } else {
      form.setValue("cartaoId", null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              {...form.register("descricao")}
              placeholder="Descrição do gasto"
            />
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              {...form.register("valor", { valueAsNumber: true })}
              placeholder="0,00"
            />
            {form.formState.errors.valor && (
              <p className="text-sm text-red-500">{form.formState.errors.valor.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              {...form.register("data")}
            />
            {form.formState.errors.data && (
              <p className="text-sm text-red-500">{form.formState.errors.data.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={form.watch("categoria")} onValueChange={(value) => form.setValue("categoria", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter((cat: any) => cat.tipo === "despesa").map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoria && (
              <p className="text-sm text-red-500">{form.formState.errors.categoria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
            <Select value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.metodoPagamento && (
              <p className="text-sm text-red-500">{form.formState.errors.metodoPagamento.message}</p>
            )}
          </div>

          {selectedPaymentMethod === "credito" && (
            <div className="space-y-2">
              <Label htmlFor="cartaoId">Cartão de Crédito</Label>
              <Select value={form.watch("cartaoId") || ""} onValueChange={(value) => form.setValue("cartaoId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card: any) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nome} **** {card.final}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPaymentMethod && selectedPaymentMethod !== "credito" && selectedPaymentMethod !== "dinheiro" && (
            <div className="space-y-2">
              <Label htmlFor="bancoId">Banco</Label>
              <Select value={form.watch("bancoId") || ""} onValueChange={(value) => form.setValue("bancoId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank: any) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as "pendente" | "pago")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...form.register("observacoes")}
              placeholder="Observações adicionais (opcional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={updateExpenseMutation.isPending}>
              {updateExpenseMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}