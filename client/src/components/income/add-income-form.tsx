import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Calendar, DollarSign, Tag, Building, RefreshCw, Users, Hash, FileText } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface AddIncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  categories: any[];
}

export function AddIncomeForm({ isOpen, onClose, banks, categories }: AddIncomeFormProps) {
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0],
    categoria: "",
    bancoId: "",
    recorrente: false,
    frequencia: "",
    comprovante: "",
    status: "recebido",
    // Campos para parcelamento
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

  const incomeCategories = categories.filter(cat => cat.tipo === "receita");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addIncomeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/incomes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Sucesso",
        description: "Receita adicionada com sucesso!",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar receita",
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
    
    if (formData.status === "recebido" && !formData.bancoId) {
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
    
    if (formData.isParcelado && !formData.dataRecebimento) {
      newErrors.dataRecebimento = "Data de recebimento é obrigatória para receitas parceladas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const incomeData: any = {
      descricao: formData.descricao.trim(),
      valor: parseFloat(formData.valor),
      data: formData.data,
      categoria: formData.categoria,
      bancoId: formData.bancoId,
      recorrente: formData.recorrente,
      status: formData.isParcelado ? "pendente" : (formData.status || "recebido"),
    };

    if (formData.recorrente) {
      incomeData.frequencia = formData.frequencia;
    }

    if (formData.comprovante) {
      incomeData.comprovante = formData.comprovante;
    }

    // Adicionar dados de parcelamento se necessário
    if (formData.isParcelado) {
      incomeData.totalParcelas = parseInt(formData.totalParcelas);
      incomeData.devedor = formData.devedor.trim();
      incomeData.valorTotal = parseFloat(formData.valor) * parseInt(formData.totalParcelas);
      incomeData.bancoId = null; // Receitas parceladas começam sem banco
      incomeData.data = formData.dataRecebimento; // Usar data de recebimento para parcelamento
      incomeData.dataRecebimento = formData.dataRecebimento;
      if (formData.observacoes) {
        incomeData.observacoes = formData.observacoes.trim();
      }
    }

    addIncomeMutation.mutate(incomeData);
  };

  const handleClose = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      bancoId: "",
      recorrente: false,
      frequencia: "",
      comprovante: "",
      status: "recebido",
      isParcelado: false,
      totalParcelas: "",
      devedor: "",
      observacoes: "",
      dataRecebimento: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    onClose();
  };

  const frequencyOptions = [
    { value: "semanal", label: "Semanal" },
    { value: "quinzenal", label: "Quinzenal" },
    { value: "mensal", label: "Mensal" },
    { value: "bimestral", label: "Bimestral" },
    { value: "trimestral", label: "Trimestral" },
    { value: "anual", label: "Anual" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-green-500" />
            Adicionar Receita
          </DialogTitle>
          <DialogDescription>
            Registre uma nova receita ou entrada em seu controle financeiro.
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
              placeholder="Ex: Salário, Freelance, Venda..."
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
                {incomeCategories.map((category) => (
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

          {/* Status de Recebimento (apenas se não for parcelada) */}
          {!formData.isParcelado && (
            <div>
              <Label htmlFor="status">Status do Recebimento *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value, bancoId: value === "pendente" ? "" : formData.bancoId })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recebido">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Já recebido
                    </div>
                  </SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Recebimento pendente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conta Bancária (apenas se status for 'recebido' e não for parcelada) */}
          {formData.status === "recebido" && !formData.isParcelado && (
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

          {/* Receita Parcelada */}
          <div className="flex items-center space-x-2">
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
            <Label htmlFor="isParcelado" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Receita parcelada
            </Label>
          </div>

          {/* Campos específicos para receitas parceladas */}
          {formData.isParcelado && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalParcelas" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
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
                    className={errors.totalParcelas ? "border-red-500" : ""}
                  />
                  {errors.totalParcelas && <p className="text-sm text-red-500 mt-1">{errors.totalParcelas}</p>}
                </div>

                <div>
                  <Label htmlFor="devedor" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Nome do Devedor *
                  </Label>
                  <Input
                    id="devedor"
                    value={formData.devedor}
                    onChange={(e) => setFormData({ ...formData, devedor: e.target.value })}
                    placeholder="Ex: João Silva"
                    className={errors.devedor ? "border-red-500" : ""}
                  />
                  {errors.devedor && <p className="text-sm text-red-500 mt-1">{errors.devedor}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="dataRecebimento" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data do Primeiro Recebimento *
                </Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.dataRecebimento}
                  onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                  className={errors.dataRecebimento ? "border-red-500" : ""}
                />
                {errors.dataRecebimento && <p className="text-sm text-red-500 mt-1">{errors.dataRecebimento}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  As próximas parcelas serão automaticamente distribuídas mensalmente a partir desta data
                </p>
              </div>

              <div>
                <Label htmlFor="observacoes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações (opcional)
                </Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o parcelamento..."
                />
              </div>

              {/* Resumo do parcelamento */}
              {formData.valor && formData.totalParcelas && parseFloat(formData.valor) > 0 && parseInt(formData.totalParcelas) > 1 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Resumo do Parcelamento:</strong></p>
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
          {!formData.isParcelado && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, recorrente: checked as boolean, frequencia: "" })
                }
              />
              <Label htmlFor="recorrente" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Receita recorrente
              </Label>
            </div>
          )}

          {/* Frequência (se recorrente) */}
          {formData.recorrente && (
            <div>
              <Label htmlFor="frequencia">Frequência *</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                <SelectTrigger className={errors.frequencia ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
            disabled={addIncomeMutation.isPending}
          />

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={addIncomeMutation.isPending}
            >
              {addIncomeMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}