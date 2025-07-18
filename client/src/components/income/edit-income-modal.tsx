import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editIncomeSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  bancoId: z.string().nullable(),
  recorrente: z.boolean(),
  frequencia: z.string().nullable(),
  status: z.enum(["pendente", "recebido"]),
  comprovante: z.string().nullable(),
  dataRecebimento: z.string().nullable(),
});

type EditIncomeForm = z.infer<typeof editIncomeSchema>;

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: any;
  banks: any[];
  categories: any[];
}

export function EditIncomeModal({ isOpen, onClose, income, banks, categories }: EditIncomeModalProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditIncomeForm>({
    resolver: zodResolver(editIncomeSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      data: "",
      categoria: "",
      bancoId: null,
      recorrente: false,
      frequencia: null,
      status: "pendente",
      comprovante: null,
      dataRecebimento: null,
    },
  });

  // Reset form when income changes
  useEffect(() => {
    if (income) {
      const incomeDate = new Date(income.data);
      const formattedDate = incomeDate.toISOString().split('T')[0];
      
      let formattedReceiptDate = null;
      if (income.dataRecebimento) {
        const receiptDate = new Date(income.dataRecebimento);
        formattedReceiptDate = receiptDate.toISOString().split('T')[0];
      }
      
      form.reset({
        descricao: income.descricao || "",
        valor: income.valor || 0,
        data: formattedDate,
        categoria: income.categoria || "",
        bancoId: income.bancoId || null,
        recorrente: income.recorrente || false,
        frequencia: income.frequencia || null,
        status: income.status || "pendente",
        comprovante: income.comprovante || null,
        dataRecebimento: formattedReceiptDate,
      });
      setIsRecurring(income.recorrente || false);
    }
  }, [income, form]);

  const updateIncomeMutation = useMutation({
    mutationFn: async (data: EditIncomeForm) => {
      const response = await apiRequest("PUT", `/api/incomes/${income.id}`, {
        ...data,
        valor: Number(data.valor),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      toast({
        title: "Sucesso",
        description: "Receita atualizada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar receita",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditIncomeForm) => {
    updateIncomeMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setIsRecurring(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Receita</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              {...form.register("descricao")}
              placeholder="Descrição da receita"
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
              placeholder="0.00"
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

          {/* Campo de data de recebimento apenas para receitas parceladas */}
          {income?.totalParcelas && income?.totalParcelas > 1 && (
            <div className="space-y-2">
              <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
              <Input
                id="dataRecebimento"
                type="date"
                {...form.register("dataRecebimento")}
              />
              <p className="text-xs text-muted-foreground">
                Data prevista para recebimento desta parcela
              </p>
              {form.formState.errors.dataRecebimento && (
                <p className="text-sm text-red-500">{form.formState.errors.dataRecebimento.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={form.watch("categoria")}
              onValueChange={(value) => form.setValue("categoria", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as "pendente" | "recebido")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status da receita" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
            )}
          </div>

          {form.watch("status") === "recebido" && (
            <div className="space-y-2">
              <Label htmlFor="bancoId">Banco</Label>
              <Select
                value={form.watch("bancoId") || ""}
                onValueChange={(value) => form.setValue("bancoId", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
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

          <div className="flex items-center space-x-2">
            <Switch
              id="recorrente"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked);
                form.setValue("recorrente", checked);
                if (!checked) {
                  form.setValue("frequencia", null);
                }
              }}
            />
            <Label htmlFor="recorrente">Receita recorrente</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="frequencia">Frequência</Label>
              <Select
                value={form.watch("frequencia") || ""}
                onValueChange={(value) => form.setValue("frequencia", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comprovante">Comprovante (URL)</Label>
            <Input
              id="comprovante"
              {...form.register("comprovante")}
              placeholder="https://exemplo.com/comprovante.pdf"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateIncomeMutation.isPending}
            >
              {updateIncomeMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}