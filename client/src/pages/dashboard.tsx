import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BanksSection } from "@/components/dashboard/banks-section";
import { CreditCardsSection } from "@/components/dashboard/credit-cards-section";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { PendingReceipts } from "@/components/dashboard/pending-receipts";
import { PendingPayments } from "@/components/dashboard/pending-payments";
import { AddTransactionModal } from "@/components/modals/add-transaction-modal";
import { AddBankModal } from "@/components/modals/add-bank-modal";
import { AddCreditCardModal } from "@/components/modals/add-credit-card-modal";
import { GoalsSection } from "@/components/dashboard/goals-section";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { user } = useAuth();

  const { data: banks = [] } = useQuery({
    queryKey: ["/api/banks"],
    enabled: !!user,
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ["/api/incomes"],
    enabled: !!user,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  const { data: creditCards = [] } = useQuery({
    queryKey: ["/api/credit-cards"],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  // Helper functions
  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1);
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const isInSelectedMonth = (dateString: string) => {
    const date = new Date(dateString);
    const [year, month] = selectedMonth.split('-');
    return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
  };

  // Filter data by selected month
  const filteredIncomes = incomes.filter((income: any) => isInSelectedMonth(income.data));
  const filteredExpenses = expenses.filter((expense: any) => isInSelectedMonth(expense.data));

  // Filter pending transactions for current month
  const pendingIncomes = filteredIncomes.filter((income: any) => income.status === "pendente");
  const pendingExpenses = filteredExpenses.filter((expense: any) => expense.status === "pendente");

  // Calculate summary data for selected month
  const totalBalance = banks.reduce((sum: number, bank: any) => sum + bank.saldo, 0);
  const monthlyIncome = filteredIncomes.reduce((sum: number, income: any) => sum + income.valor, 0);
  const monthlyExpenses = filteredExpenses.reduce((sum: number, expense: any) => sum + expense.valor, 0);
  const openInvoices = invoices
    .filter((invoice: any) => !invoice.pago && invoice.mesAno === selectedMonth)
    .reduce((sum: number, invoice: any) => sum + invoice.valorTotal, 0);

  // Recent transactions for selected month
  const recentTransactions = [
    ...filteredIncomes.slice(0, 2).map((income: any) => ({
      id: income.id,
      description: income.descricao,
      amount: income.valor,
      date: new Date(income.data).toLocaleDateString('pt-BR'),
      type: "income" as const,
      category: income.categoria,
    })),
    ...filteredExpenses.slice(0, 2).map((expense: any) => ({
      id: expense.id,
      description: expense.descricao,
      amount: expense.valor,
      date: new Date(expense.data).toLocaleDateString('pt-BR'),
      type: "expense" as const,
      category: expense.categoria,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  // Get upcoming bills from real data
  const upcomingBills = invoices
    .filter((invoice: any) => !invoice.pago)
    .map((invoice: any) => {
      const dueDate = new Date(invoice.dataVencimento);
      const today = new Date();
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      let status: "overdue" | "due_soon" | "ok" = "ok";
      if (daysDiff < 0) status = "overdue";
      else if (daysDiff <= 7) status = "due_soon";

      const creditCard = creditCards.find((card: any) => card.id === invoice.cartaoId);
      
      return {
        id: invoice.id,
        description: `Fatura ${creditCard?.nome || 'Cartão'}`,
        amount: invoice.valorTotal,
        dueDate: dueDate.toLocaleDateString('pt-BR'),
        status,
        type: "invoice" as const,
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-muted">
      <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Visão geral das suas finanças</p>
            </div>
            
            {/* Mobile layout - stack controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="text-white hover:bg-white hover:bg-opacity-20 hover:text-white dark:text-white dark:hover:bg-white dark:hover:bg-opacity-20 p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#00000069]">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium text-sm min-w-[120px] sm:min-w-[140px] text-center bg-[#03030300] text-[#ffffff]">
                    {getMonthName(selectedMonth)}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="text-white hover:bg-white hover:bg-opacity-20 hover:text-white dark:text-white dark:hover:bg-white dark:hover:bg-opacity-20 p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => setTransactionModalOpen(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white hover:text-white w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6">
          <SummaryCards
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            openInvoices={openInvoices}
          />

          {/* Goals and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <GoalsSection 
              currentMonth={new Date(selectedMonth + "-01")} 
              incomes={incomes} 
              expenses={expenses} 
            />
            <RecentTransactions transactions={recentTransactions} />
          </div>

          {/* Pending Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <PendingReceipts 
              pendingIncomes={pendingIncomes} 
              banks={banks}
              categories={categories}
            />
            <PendingPayments 
              pendingExpenses={pendingExpenses} 
              banks={banks}
              creditCards={creditCards}
              categories={categories}
            />
          </div>

          {/* Banks and Credit Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <BanksSection banks={banks} onAddBank={() => setBankModalOpen(true)} />
            <CreditCardsSection 
              creditCards={creditCards} 
              onAddCreditCard={() => setCreditCardModalOpen(true)}
              expenses={filteredExpenses}
              invoices={invoices}
              selectedMonth={selectedMonth}
            />
          </div>

          {/* Upcoming Bills */}
          <UpcomingBills bills={upcomingBills} />
        </div>
      </main>
      {/* Quick Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          onClick={() => setTransactionModalOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      {/* Modals */}
      <AddTransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        banks={banks}
        creditCards={creditCards}
        categories={categories}
      />
      <AddBankModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
      />
      <AddCreditCardModal
        isOpen={creditCardModalOpen}
        onClose={() => setCreditCardModalOpen(false)}
      />
    </div>
  );
}
