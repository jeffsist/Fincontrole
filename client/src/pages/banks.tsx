import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AddBankModal } from "@/components/modals/add-bank-modal";
import { EditBankModal } from "@/components/modals/edit-bank-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, University, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bank } from "@shared/firebase-schema";

export default function Banks() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banks = [] } = useQuery({
    queryKey: ["/api/banks"],
    enabled: !!user,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalBalance = banks.reduce((sum: number, bank: any) => sum + bank.saldo, 0);

  const deleteBankMutation = useMutation({
    mutationFn: async (bankId: string) => {
      return apiRequest("DELETE", `/api/banks/${bankId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Sucesso",
        description: "Conta bancária excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta bancária",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (bank: Bank) => {
    console.log("Banks page - handleEdit called with:", bank);
    setEditModalOpen(false); // Fechar primeiro para garantir reset
    setTimeout(() => {
      setSelectedBank(bank);
      setEditModalOpen(true);
    }, 10);
  };

  const handleDelete = (bank: Bank) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${bank.nome}"?`)) {
      deleteBankMutation.mutate(bank.id);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Contas Bancárias</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Gerencie suas contas e saldos</p>
            </div>
            <Button
              onClick={() => setBankModalOpen(true)}
              className="bg-card bg-opacity-20 hover:bg-opacity-30 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total de Contas</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{banks.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Saldo Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-secondary">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Maior Saldo</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {banks.length > 0 ? formatCurrency(Math.max(...banks.map((b: any) => b.saldo))) : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banks List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {banks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <University className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma conta bancária cadastrada</p>
                <Button onClick={() => setBankModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeira Conta
                </Button>
              </div>
            ) : (
              banks.map((bank: any) => (
                <Card key={bank.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center mr-3"
                          style={{ backgroundColor: bank.cor }}
                        >
                          <University className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{bank.nome}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{bank.tipo}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(bank)}
                          title="Editar conta"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(bank)}
                          title="Excluir conta"
                          disabled={deleteBankMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(bank.saldo)}
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Criada em</span>
                        <span>{new Date(bank.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <AddBankModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
      />
      
      <EditBankModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        bank={selectedBank}
      />
    </div>
  );
}
