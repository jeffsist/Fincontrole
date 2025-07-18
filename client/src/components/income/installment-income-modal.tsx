import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Hash, Users, Calendar, DollarSign, CheckCircle, Clock, Building } from "lucide-react";
import { ConfirmReceiptModal } from "../modals/confirm-receipt-modal";

interface InstallmentIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: any; // The parent income record
  banks: any[];
}

export function InstallmentIncomeModal({ isOpen, onClose, income, banks }: InstallmentIncomeModalProps) {
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ["/api/incomes/installments", income?.parcelaGrupoId],
    queryFn: () => apiRequest("GET", `/api/incomes/installments/${income?.parcelaGrupoId}`),
    enabled: isOpen && !!income?.parcelaGrupoId,
  });

  // Ensure installments is always an array
  const installmentsArray = Array.isArray(installments) ? installments : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    if (status === "recebido") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Recebido</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
  };

  const handleConfirmReceipt = (installment: any) => {
    setSelectedInstallment(installment);
    setIsConfirmModalOpen(true);
  };

  const pendingInstallments = installmentsArray.filter((inst: any) => inst.status === "pendente");
  const receivedInstallments = installmentsArray.filter((inst: any) => inst.status === "recebido");
  const totalReceived = receivedInstallments.reduce((sum: number, inst: any) => sum + inst.valor, 0);
  const totalPending = pendingInstallments.reduce((sum: number, inst: any) => sum + inst.valor, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              Receita Parcelada - {income?.descricao}
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie todas as parcelas desta receita parcelada
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Devedor</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{income?.devedor}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">{formatCurrency(income?.valorTotal || 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-green-600">{formatCurrency(totalReceived)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">{formatCurrency(totalPending)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Observações */}
              {income?.observacoes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-foreground">{income.observacoes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Parcelas */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Parcelas ({installmentsArray.length})</h3>
                <div className="space-y-3">
                  {installmentsArray.map((installment: any) => (
                    <Card key={installment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{installment.parcela}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{formatDate(installment.data)}</span>
                            </div>
                            
                            {installment.dataRecebimento && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-600 text-sm">
                                  Prev: {formatDate(installment.dataRecebimento)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{formatCurrency(installment.valor)}</span>
                            </div>

                            {getStatusBadge(installment.status)}

                            {installment.bancoId && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building className="w-4 h-4" />
                                <span>{banks.find(b => b.id === installment.bancoId)?.nome}</span>
                              </div>
                            )}
                          </div>

                          {installment.status === "pendente" && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmReceipt(installment)}
                              className="ml-4"
                            >
                              Confirmar Recebimento
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Progresso */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Progresso do Recebimento</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${installmentsArray.length > 0 ? (receivedInstallments.length / installmentsArray.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{receivedInstallments.length} de {installmentsArray.length} parcelas recebidas</span>
                    <span>{installmentsArray.length > 0 ? Math.round((receivedInstallments.length / installmentsArray.length) * 100) : 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedInstallment && (
        <ConfirmReceiptModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setSelectedInstallment(null);
          }}
          income={selectedInstallment}
          banks={banks}
        />
      )}
    </>
  );
}