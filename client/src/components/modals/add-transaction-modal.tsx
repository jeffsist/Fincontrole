import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown, Calendar, DollarSign, Tag, Building, CreditCard, RefreshCw, Receipt, Hash, Users, FileText } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  creditCards: any[];
  categories: any[];
}

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  banks, 
  creditCards, 
  categories 
}: AddTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0],
    categoria: "",
    bancoId: "",
    metodoPagamento: "dinheiro",
    cartaoId: "",
    recorrente: false,
    frequencia: "",
    comprovante: "",
    status: "recebido",
    parcelas: "",
    valorTotal: "",
    isParcelado: false,
    totalParcelas: "",
    devedor: "",
    observacoes: "",
    dataRecebimento: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = transactionType === "income" ? "/api/incomes" : "/api/expenses";
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sucesso",
        description: `${transactionType === "income" ? "Receita" : "Gasto"} adicionado com sucesso!`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar transação",
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
    
    if (transactionType === "income") {
      if (formData.status === "recebido" && !formData.isParcelado && !formData.bancoId) {
        newErrors.bancoId = "Conta bancária é obrigatória para receitas já recebidas";
      }
      
      if (formData.recorrente && !formData.frequencia) {
        newErrors.frequencia = "Frequência é obrigatória para receitas recorrentes";
      }
      
      if (formData.isParcelado && (!formData.totalParcelas || parseInt(formData.totalParcelas) < 2)) {
        newErrors.totalParcelas = "Número de parcelas deve ser maior que 1";
      }
      
      if (formData.isParcelado && !formData.devedor.trim()) {
        newErrors.devedor = "Nome do devedor é obrigatório para receitas parceladas";
      }
    } else {
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
      
      if (formData.parcelas && parseInt(formData.parcelas) > 1) {
        if (!formData.valorTotal) {
          newErrors.valorTotal = "Valor total é obrigatório para parcelamento";
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

    const baseData = {
      descricao: formData.descricao.trim(),
      valor: parseFloat(formData.valor),
      categoria: formData.categoria,
      data: formData.data,
      recorrente: formData.recorrente,
    };

    if (transactionType === "income") {
      const incomeData: any = {
        ...baseData,
        status: formData.isParcelado ? "pendente" : (formData.status || "recebido"),
        bancoId: formData.bancoId,
      };

      if (formData.recorrente) {
        incomeData.frequencia = formData.frequencia;
      }

      if (formData.comprovante) {
        incomeData.comprovante = formData.comprovante;
      }

      if (formData.isParcelado) {
        incomeData.totalParcelas = parseInt(formData.totalParcelas);
        incomeData.devedor = formData.devedor.trim();
        incomeData.valorTotal = parseFloat(formData.valor) * parseInt(formData.totalParcelas);
        incomeData.bancoId = null;
        incomeData.dataRecebimento = formData.dataRecebimento;
        if (formData.observacoes) {
          incomeData.observacoes = formData.observacoes.trim();
        }
      }

      addTransactionMutation.mutate(incomeData);
    } else {
      const expenseData: any = {
        ...baseData,
        metodoPagamento: formData.metodoPagamento,
        status: formData.status || "pago",
      };

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

      if (formData.observacoes) {
        expenseData.observacoes = formData.observacoes;
      }

      // Parcelamento - criar múltiplas despesas no client
      if (formData.parcelas && parseInt(formData.parcelas) > 1) {
        const totalParcelas = parseInt(formData.parcelas);
        const valorTotal = parseFloat(formData.valorTotal);
        const valorParcela = valorTotal / totalParcelas;
        const parcelaGrupoId = `expense_${Date.now()}`;
        
        console.log("=== DASHBOARD: Creating installment expenses ===");
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
          queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
          queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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

      addTransactionMutation.mutate(expenseData);
    }
  };

  const handleClose = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      bancoId: "",
      metodoPagamento: "dinheiro",
      cartaoId: "",
      recorrente: false,
      frequencia: "",
      comprovante: "",
      status: "recebido",
      parcelas: "",
      valorTotal: "",
      isParcelado: false,
      totalParcelas: "",
      devedor: "",
      observacoes: "",
      dataRecebimento: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setTransactionType("income");
    onClose();
  };

  const filteredCategories = categories.filter(cat => cat.tipo === (transactionType === "income" ? "receita" : "despesa"));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const frequencyOptions = [
    { value: "semanal", label: "Semanal" },
    { value: "quinzenal", label: "Quinzenal" },
    { value: "mensal", label: "Mensal" },
    { value: "bimestral", label: "Bimestral" },
    { value: "trimestral", label: "Trimestral" },
    { value: "anual", label: "Anual" },
  ];

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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl mx-auto">
        <DialogHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold">
            <div className={`p-1.5 sm:p-2 rounded-full ${transactionType === "income" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
              {transactionType === "income" ? (
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              )}
            </div>
            <span className="text-base sm:text-xl">
              {transactionType === "income" ? "Adicionar Receita" : "Adicionar Gasto"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Registre uma nova {transactionType === "income" ? "receita" : "despesa"} em seu controle financeiro com todos os detalhes necessários.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              type="button"
              variant={transactionType === "income" ? "default" : "outline"}
              className={`flex-1 h-10 sm:h-12 text-sm sm:text-base ${transactionType === "income" ? "bg-green-600 hover:bg-green-700 text-white" : "border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
              onClick={() => {
                setTransactionType("income");
                setFormData({ ...formData, status: "recebido", bancoId: "", cartaoId: "" });
              }}
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Receita
            </Button>
            <Button
              type="button"
              variant={transactionType === "expense" ? "default" : "outline"}
              className={`flex-1 h-10 sm:h-12 text-sm sm:text-base ${transactionType === "expense" ? "bg-red-600 hover:bg-red-700 text-white" : "border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
              onClick={() => {
                setTransactionType("expense");
                setFormData({ ...formData, status: "pago", metodoPagamento: "dinheiro", bancoId: "", cartaoId: "" });
              }}
            >
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Gasto
            </Button>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="descricao" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              Descrição *
            </Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder={transactionType === "income" ? "Ex: Salário, Freelance, Venda..." : "Ex: Supermercado, Gasolina, Aluguel..."}
              className={`h-10 sm:h-11 text-sm sm:text-base ${errors.descricao ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
            />
            {errors.descricao && <p className="text-xs sm:text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.descricao}
            </p>}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="valor" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                Valor *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className={`h-10 sm:h-11 text-sm sm:text-base ${errors.valor ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
              />
              {errors.valor && <p className="text-xs sm:text-sm text-red-500 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.valor}
              </p>}
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="data" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className={`h-10 sm:h-11 text-sm sm:text-base ${errors.data ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
              />
              {errors.data && <p className="text-xs sm:text-sm text-red-500 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.data}
              </p>}
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="categoria" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              Categoria *
            </Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${errors.categoria ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.cor }}
                      />
                      <span className="text-sm">{category.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-xs sm:text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.categoria}
            </p>}
          </div>

          {/* Receita Parcelada (apenas para receitas) */}
          {transactionType === "income" && (
            <div className="flex items-center space-x-2 p-3 sm:p-0">
              <Checkbox
                id="isParcelado"
                checked={formData.isParcelado}
                onCheckedChange={(checked) => 
                  setFormData({ 
                    ...formData, 
                    isParcelado: checked as boolean, 
                    totalParcelas: "",
                    devedor: "",
                    observacoes: "",
                    dataRecebimento: new Date().toISOString().split('T')[0],
                    recorrente: false, // Não pode ser recorrente e parcelado ao mesmo tempo
                    status: checked ? "pendente" : "recebido"
                  })
                }
              />
              <Label htmlFor="isParcelado" className="flex items-center gap-1.5 sm:gap-2 text-sm cursor-pointer">
                <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Receita parcelada
              </Label>
            </div>
          )}

          {/* Status (apenas se não for parcelada para receitas) */}
          {!(transactionType === "income" && formData.isParcelado) && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status {transactionType === "income" ? "do Recebimento" : "do Pagamento"} *
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ 
                ...formData, 
                status: value, 
                bancoId: value === "pendente" ? "" : formData.bancoId,
                metodoPagamento: value === "pendente" ? "pendente" : formData.metodoPagamento,
                cartaoId: "",
              })}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={transactionType === "income" ? "recebido" : "pago"}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Já {transactionType === "income" ? "recebido" : "pago"}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">{transactionType === "income" ? "Recebimento" : "Pagamento"} pendente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Método de Pagamento (apenas se status for 'pago' para gastos) */}
          {transactionType === "expense" && formData.status === "pago" && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="metodoPagamento" className="text-sm font-medium">Método de Pagamento *</Label>
              <Select value={formData.metodoPagamento} onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value, cartaoId: "", bancoId: "" })}>
                <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${errors.metodoPagamento ? "border-red-500" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-sm">{method.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.metodoPagamento && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.metodoPagamento}</p>}
            </div>
          )}

          {/* Cartão de Crédito */}
          {formData.status === "pago" && formData.metodoPagamento === "credito" && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="cartaoId" className="text-sm font-medium">Cartão de Crédito *</Label>
              <Select value={formData.cartaoId} onValueChange={(value) => setFormData({ ...formData, cartaoId: value })}>
                <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${errors.cartaoId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-sm">{card.nome} •••• {card.final}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {card.bandeira}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cartaoId && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.cartaoId}</p>}
            </div>
          )}

          {/* Conta Bancária */}
          {((transactionType === "income" && formData.status === "recebido" && !formData.isParcelado) || 
            (transactionType === "expense" && formData.status === "pago" && formData.metodoPagamento !== "credito")) && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="bancoId" className="text-sm font-medium">Conta Bancária *</Label>
              <Select value={formData.bancoId} onValueChange={(value) => setFormData({ ...formData, bancoId: value })}>
                <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${errors.bancoId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-sm">{bank.nome}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {bank.tipo}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bancoId && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.bancoId}</p>}
            </div>
          )}

          {/* Campos específicos para receitas parceladas */}
          {transactionType === "income" && formData.isParcelado && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="totalParcelas" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                    <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Número de Parcelas *
                  </Label>
                  <Input
                    id="totalParcelas"
                    type="number"
                    min="2"
                    max="60"
                    value={formData.totalParcelas}
                    onChange={(e) => setFormData({ ...formData, totalParcelas: e.target.value })}
                    placeholder="Ex: 10"
                    className={`h-10 sm:h-11 text-sm sm:text-base ${errors.totalParcelas ? "border-red-500" : ""}`}
                  />
                  {errors.totalParcelas && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.totalParcelas}</p>}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="devedor" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Nome do Devedor *
                  </Label>
                  <Input
                    id="devedor"
                    value={formData.devedor}
                    onChange={(e) => setFormData({ ...formData, devedor: e.target.value })}
                    placeholder="Ex: João Silva"
                    className={`h-10 sm:h-11 text-sm sm:text-base ${errors.devedor ? "border-red-500" : ""}`}
                  />
                  {errors.devedor && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.devedor}</p>}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="dataRecebimento" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Data do Primeiro Recebimento *
                </Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.dataRecebimento}
                  onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                  className={`h-10 sm:h-11 text-sm sm:text-base ${errors.dataRecebimento ? "border-red-500" : ""}`}
                />
                {errors.dataRecebimento && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.dataRecebimento}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  As próximas parcelas serão automaticamente distribuídas mensalmente a partir desta data
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="observacoes" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Observações (opcional)
                </Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o parcelamento..."
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              {/* Resumo do parcelamento */}
              {formData.valor && formData.totalParcelas && parseFloat(formData.valor) > 0 && parseInt(formData.totalParcelas) > 1 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p className="font-medium">Resumo do Parcelamento:</p>
                    <p>• Valor total: {formatCurrency(parseFloat(formData.valor) * parseInt(formData.totalParcelas))}</p>
                    <p>• Valor por parcela: {formatCurrency(parseFloat(formData.valor))}</p>
                    <p>• Quantidade de parcelas: {formData.totalParcelas}x</p>
                    <p>• Status: Todas as parcelas começarão como pendentes</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Receita Recorrente (apenas se não for parcelada) */}
          {transactionType === "income" && !formData.isParcelado && (
            <div className="flex items-center space-x-2 p-3 sm:p-0">
              <Checkbox
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, recorrente: checked as boolean, frequencia: "" })
                }
              />
              <Label htmlFor="recorrente" className="flex items-center gap-1.5 sm:gap-2 text-sm cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Receita recorrente
              </Label>
            </div>
          )}

          {/* Gasto Recorrente */}
          {transactionType === "expense" && (
            <div className="flex items-center space-x-2 p-3 sm:p-0">
              <Checkbox
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked as boolean })}
              />
              <Label htmlFor="recorrente" className="text-sm cursor-pointer">Gasto recorrente</Label>
            </div>
          )}

          {/* Frequência */}
          {formData.recorrente && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="frequencia" className="text-sm font-medium">Frequência *</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${errors.frequencia ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="text-sm">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequencia && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.frequencia}</p>}
            </div>
          )}

          {/* Parcelamento (apenas para crédito e status pago em gastos) */}
          {transactionType === "expense" && formData.status === "pago" && formData.metodoPagamento === "credito" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="parcelas" className="text-sm font-medium">Número de Parcelas</Label>
                <Select value={formData.parcelas} onValueChange={(value) => setFormData({ ...formData, parcelas: value, valorTotal: "" })}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="À vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <span className="text-sm">À vista</span>
                    </SelectItem>
                    {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        <span className="text-sm">{num}x</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.parcelas && parseInt(formData.parcelas) > 1 && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="valorTotal" className="text-sm font-medium">Valor Total</Label>
                  <Input
                    id="valorTotal"
                    type="number"
                    step="0.01"
                    value={formData.valorTotal}
                    onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                    placeholder="Valor total parcelado"
                    className={`h-10 sm:h-11 text-sm sm:text-base ${errors.valorTotal ? "border-red-500" : ""}`}
                  />
                  {errors.valorTotal && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.valorTotal}</p>}
                  {formData.valorTotal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor por parcela: {formatCurrency(parseFloat(formData.valorTotal) / parseInt(formData.parcelas))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comprovante - Upload de Imagem */}
          <ImageUpload
            value={formData.comprovante}
            onChange={(url) => setFormData({ ...formData, comprovante: url })}
            onRemove={() => setFormData({ ...formData, comprovante: "" })}
            label="Comprovante"
            placeholder="Clique para enviar uma imagem do comprovante..."
            disabled={addTransactionMutation.isPending}
          />
          
          {/* Observações adicionais para gastos */}
          {transactionType === "expense" && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="observacoes-extras" className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Observações adicionais (opcional)
              </Label>
              <Textarea
                id="observacoes-extras"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Número da nota fiscal, observações extras sobre o gasto..."
                rows={2}
                className="text-sm sm:text-base resize-none"
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base border-2 hover:bg-gray-50 dark:hover:bg-gray-800 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={addTransactionMutation.isPending}
              className={`flex-1 h-10 sm:h-12 text-sm sm:text-base text-white font-medium order-1 sm:order-2 ${
                transactionType === "expense" 
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400" 
                  : "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
              }`}
            >
              {addTransactionMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">
                    {transactionType === "income" ? "Salvando..." : "Adicionando..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {transactionType === "income" ? (
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="text-sm sm:text-base">
                    {transactionType === "income" ? "Salvar Receita" : "Adicionar Gasto"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}