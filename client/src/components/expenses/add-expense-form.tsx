import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowDown, Calendar, DollarSign, Tag, Building, Receipt } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface AddExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  creditCards: any[];
  categories: any[];
}

export function AddExpenseForm({ isOpen, onClose, banks, creditCards, categories }: AddExpenseFormProps) {
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0],
    categoria: "",
    metodoPagamento: "dinheiro",
    cartaoId: "",
    bancoId: "",
    recorrente: false,
    frequencia: "",
    comprovante: "",
    parcelas: "",
    valorTotal: "",
    status: "pago"
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const expenseCategories = categories.filter(cat => cat.tipo === "despesa");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("=== CLIENT: Sending expense data ===");
      console.log("Expense data:", JSON.stringify(data, null, 2));
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: "Gasto adicionado com sucesso!",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar gasto",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    }
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = "Valor deve ser maior que zero";
    }
    
    if (!formData.data) {
      newErrors.data = "Data é obrigatória";
    }
    
    if (!formData.categoria) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    
    if (formData.status === "pago" && !formData.metodoPagamento) {
      newErrors.metodoPagamento = "Método de pagamento é obrigatório para gastos já pagos";
    }
    
    if (formData.status === "pago" && formData.metodoPagamento === "credito" && !formData.cartaoId) {
      newErrors.cartaoId = "Cartão de crédito é obrigatório";
    }
    
    if (formData.status === "pago" && formData.metodoPagamento !== "credito" && !formData.bancoId) {
      newErrors.bancoId = "Conta bancária é obrigatória";
    }
    
    if (formData.recorrente && !formData.frequencia) {
      newErrors.frequencia = "Frequência é obrigatória para gastos recorrentes";
    }

    // Validar parcelamento
    if (formData.parcelas && parseInt(formData.parcelas) > 1) {
      if (!formData.valorTotal) {
        newErrors.valorTotal = "Valor total é obrigatório para parcelamento";
      } else {
        const parcelas = parseInt(formData.parcelas);
        const valorTotal = parseFloat(formData.valorTotal);
        const valorParcela = parseFloat(formData.valor);
        
        if (valorTotal < valorParcela) {
          newErrors.valorTotal = "Valor total deve ser maior que o valor da parcela";
        }
        
        // Verificar se o valor da parcela está correto
        const valorParcelaCalculado = valorTotal / parcelas;
        if (Math.abs(valorParcelaCalculado - valorParcela) > 0.01) {
          newErrors.valor = "Valor da parcela não confere com o valor total dividido pelo número de parcelas";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    const expenseData: any = {
      descricao: formData.descricao.trim(),
      valor: parseFloat(formData.valor),
      data: formData.data,
      categoria: formData.categoria,
      metodoPagamento: formData.metodoPagamento,
      recorrente: formData.recorrente,
      status: formData.status || "pago",
    };

    // Adicionar campos condicionais
    if (formData.metodoPagamento === "credito") {
      expenseData.cartaoId = formData.cartaoId;
    } else {
      expenseData.bancoId = formData.bancoId;
    }

    if (formData.recorrente) {
      expenseData.frequencia = formData.frequencia;
    }

    if (formData.comprovante) {
      expenseData.comprovante = formData.comprovante;
    }

    // Parcelamento - criar múltiplas despesas
    if (formData.parcelas && parseInt(formData.parcelas) > 1) {
      const totalParcelas = parseInt(formData.parcelas);
      const valorTotal = parseFloat(formData.valorTotal);
      const valorParcela = valorTotal / totalParcelas;
      const parcelaGrupoId = `expense_${Date.now()}`;
      
      console.log("=== CLIENT: Creating installment expenses ===");
      console.log("Parcelas:", totalParcelas);
      console.log("Valor total:", valorTotal);
      console.log("Valor por parcela:", valorParcela);
      
      try {
        // Criar uma despesa para cada parcela
        for (let i = 0; i < totalParcelas; i++) {
          const parcelaData = new Date(expenseData.data);
          parcelaData.setMonth(parcelaData.getMonth() + i);
          
          const installmentData = {
            ...expenseData,
            valor: valorParcela,
            data: parcelaData.toISOString().split('T')[0],
            parcela: `${i + 1}/${totalParcelas}`,
            numeroParcela: i + 1,
            totalParcelas: totalParcelas,
            parcelaGrupoId: parcelaGrupoId,
            valorTotal: valorTotal
          };
          
          console.log(`Creating installment ${i + 1}/${totalParcelas}:`, installmentData);
          
          // Criar cada parcela individualmente
          const response = await apiRequest("POST", "/api/expenses", installmentData);
          console.log(`Installment ${i + 1} created successfully:`, response);
        }
        
        // Invalidar cache e mostrar sucesso
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        toast({
          title: "Sucesso",
          description: `Gasto parcelado em ${totalParcelas}x criado com sucesso!`,
        });
        handleClose();
        return;
      } catch (error) {
        console.error("Error creating installment expenses:", error);
        toast({
          title: "Erro",
          description: "Erro ao criar gastos parcelados. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
    }

    addExpenseMutation.mutate(expenseData);
  };

  const handleClose = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      metodoPagamento: "dinheiro",
      cartaoId: "",
      bancoId: "",
      recorrente: false,
      frequencia: "",
      comprovante: "",
      parcelas: "",
      valorTotal: "",
      status: "pago"
    });
    setErrors({});
    onClose();
  };

  const paymentMethods = [
    { value: "dinheiro", label: "Dinheiro", icon: DollarSign },
    { value: "debito", label: "Débito", icon: CreditCard },
    { value: "credito", label: "Crédito", icon: CreditCard },
    { value: "pix", label: "PIX", icon: ArrowDown },
    { value: "transferencia", label: "Transferência", icon: Building },
    { value: "boleto", label: "Boleto", icon: Receipt },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-red-500" />
            Adicionar Gasto
          </DialogTitle>
          <DialogDescription>
            Registre um novo gasto ou despesa em seu controle financeiro.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div>
            <Label htmlFor="descricao" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Descrição *
            </Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Supermercado, Gasolina, Aluguel..."
              className={errors.descricao ? "border-red-500" : ""}
            />
            {errors.descricao && <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className={errors.valor ? "border-red-500" : ""}
              />
              {errors.valor && <p className="text-sm text-red-500 mt-1">{errors.valor}</p>}
            </div>
            
            <div>
              <Label htmlFor="data" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className={errors.data ? "border-red-500" : ""}
              />
              {errors.data && <p className="text-sm text-red-500 mt-1">{errors.data}</p>}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.cor }}
                      />
                      {category.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-sm text-red-500 mt-1">{errors.categoria}</p>}
          </div>

          {/* Status de Pagamento */}
          <div>
            <Label htmlFor="status">Status do Pagamento *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value, metodoPagamento: value === "pendente" ? "pendente" : "dinheiro", cartaoId: "", bancoId: "" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Já pago
                  </div>
                </SelectItem>
                <SelectItem value="pendente">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    Pagamento pendente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Método de Pagamento (apenas se status for 'pago') */}
          {formData.status === "pago" && (
            <div>
              <Label htmlFor="metodoPagamento">Método de Pagamento *</Label>
              <Select value={formData.metodoPagamento} onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value, cartaoId: "", bancoId: "" })}>
                <SelectTrigger className={errors.metodoPagamento ? "border-red-500" : ""}>
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
              {errors.metodoPagamento && <p className="text-sm text-red-500 mt-1">{errors.metodoPagamento}</p>}
            </div>
          )}

          {/* Cartão de Crédito (se método for crédito e status for pago) */}
          {formData.status === "pago" && formData.metodoPagamento === "credito" && (
            <div>
              <Label htmlFor="cartaoId">Cartão de Crédito *</Label>
              <Select value={formData.cartaoId} onValueChange={(value) => setFormData({ ...formData, cartaoId: value })}>
                <SelectTrigger className={errors.cartaoId ? "border-red-500" : ""}>
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
              {errors.cartaoId && <p className="text-sm text-red-500 mt-1">{errors.cartaoId}</p>}
            </div>
          )}

          {/* Conta Bancária (se método não for crédito e status for pago) */}
          {formData.status === "pago" && formData.metodoPagamento !== "credito" && (
            <div>
              <Label htmlFor="bancoId">Conta Bancária *</Label>
              <Select value={formData.bancoId} onValueChange={(value) => setFormData({ ...formData, bancoId: value })}>
                <SelectTrigger className={errors.bancoId ? "border-red-500" : ""}>
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
              {errors.bancoId && <p className="text-sm text-red-500 mt-1">{errors.bancoId}</p>}
            </div>
          )}

          {/* Parcelamento (apenas para crédito e status pago) */}
          {formData.status === "pago" && formData.metodoPagamento === "credito" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parcelas">Número de Parcelas</Label>
                <Select value={formData.parcelas} onValueChange={(value) => setFormData({ ...formData, parcelas: value, valorTotal: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="À vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">À vista</SelectItem>
                    {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.parcelas && parseInt(formData.parcelas) > 1 && (
                <div>
                  <Label htmlFor="valorTotal">Valor Total</Label>
                  <Input
                    id="valorTotal"
                    type="number"
                    step="0.01"
                    value={formData.valorTotal}
                    onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                    placeholder="Valor total parcelado"
                    className={errors.valorTotal ? "border-red-500" : ""}
                  />
                  {errors.valorTotal && <p className="text-sm text-red-500 mt-1">{errors.valorTotal}</p>}
                  {formData.valorTotal && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor por parcela: {formatCurrency(parseFloat(formData.valorTotal) / parseInt(formData.parcelas))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Gasto Recorrente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked as boolean })}
            />
            <Label htmlFor="recorrente">Gasto recorrente</Label>
          </div>

          {/* Frequência (se recorrente) */}
          {formData.recorrente && (
            <div>
              <Label htmlFor="frequencia">Frequência *</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                <SelectTrigger className={errors.frequencia ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequencia && <p className="text-sm text-red-500 mt-1">{errors.frequencia}</p>}
            </div>
          )}

          {/* Comprovante - Upload de Imagem */}
          <ImageUpload
            value={formData.comprovante}
            onChange={(url) => setFormData({ ...formData, comprovante: url })}
            onRemove={() => setFormData({ ...formData, comprovante: "" })}
            label="Comprovante"
            placeholder="Clique para enviar uma imagem do comprovante..."
            disabled={addExpenseMutation.isPending}
          />

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={addExpenseMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {addExpenseMutation.isPending ? "Adicionando..." : "Adicionar Gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}