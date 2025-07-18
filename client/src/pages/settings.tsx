import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Palette, 
  Target, 
  FolderOpen,
  Upload,
  Save,
  Plus,
  Edit2,
  Trash2,
  Camera,
  Settings as SettingsIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";

interface Category {
  id: string;
  nome: string;
  cor: string;
  tipo: "receita" | "despesa";
  userId: string;
}

interface CategoryGoal {
  id: string;
  categoryId: string;
  type: "income" | "expense";
  monthlyGoal: number;
  isActive: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  defaultTheme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ nome: "", cor: "#3b82f6", tipo: "despesa" as "receita" | "despesa" });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [goalAmount, setGoalAmount] = useState("");
  const [profileName, setProfileName] = useState("");

  // Initialize profile name when user data loads
  useEffect(() => {
    if (user?.displayName) {
      setProfileName(user.displayName);
    }
  }, [user?.displayName]);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/category-goals"],
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategory({ nome: "", cor: "#3b82f6", tipo: "despesa" });
      toast({ title: "Categoria criada com sucesso!" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditingCategory(false);
      setEditingCategory(null);
      toast({ title: "Categoria atualizada com sucesso!" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria excluída com sucesso!" });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/category-goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-goals"] });
      setIsGoalModalOpen(false);
      setSelectedCategory(null);
      setGoalAmount("");
      toast({ title: "Meta criada com sucesso!" });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategory.nome) return;
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate(editingCategory);
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${category.nome}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const handleCreateGoal = () => {
    if (!selectedCategory || !goalAmount) return;
    createGoalMutation.mutate({
      categoryId: selectedCategory.id,
      type: selectedCategory.tipo === "receita" ? "income" : "expense",
      monthlyGoal: parseFloat(goalAmount),
      isActive: true,
    });
  };

  const getCategoryGoal = (categoryId: string) => {
    return goals.find((goal: CategoryGoal) => goal.categoryId === categoryId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 lg:p-6 max-w-6xl mx-auto">
                {/* Desktop Header */}
                <div className="hidden lg:block mb-6">
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8" />
                    Configurações
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Gerencie sua conta, preferências e configurações do sistema
                  </p>
                </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Aparência
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informações do Perfil
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="text-lg">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Alterar Foto
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Recomendado: 400x400px, máximo 2MB
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Profile Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input 
                          id="email" 
                          value={user?.email || ""} 
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <Button className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notificações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificações por E-mail</p>
                        <p className="text-sm text-muted-foreground">
                          Receba resumos e alertas importantes
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lembretes de Vencimento</p>
                        <p className="text-sm text-muted-foreground">
                          Alertas sobre contas próximas do vencimento
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Relatórios Mensais</p>
                        <p className="text-sm text-muted-foreground">
                          Resumo automático das finanças
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Tema e Aparência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Tema Padrão</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card 
                          className={`cursor-pointer transition-all ${theme === 'light' ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setTheme('light')}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-full h-16 bg-gradient-to-br from-white to-gray-100 rounded-md mb-3 border"></div>
                            <p className="font-medium">Claro</p>
                            <p className="text-sm text-muted-foreground">Tema padrão claro</p>
                          </CardContent>
                        </Card>

                        <Card 
                          className={`cursor-pointer transition-all ${theme === 'dark' ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setTheme('dark')}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-full h-16 bg-gradient-to-br from-gray-900 to-black rounded-md mb-3 border"></div>
                            <p className="font-medium">Escuro</p>
                            <p className="text-sm text-muted-foreground">Tema escuro profundo</p>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer transition-all opacity-50">
                          <CardContent className="p-4 text-center">
                            <div className="w-full h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md mb-3"></div>
                            <p className="font-medium">Automático</p>
                            <p className="text-sm text-muted-foreground">Segue sistema</p>
                            <Badge variant="secondary" className="mt-1">Em breve</Badge>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Densidade da Interface</Label>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a densidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compacta</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="comfortable">Confortável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      Gerenciar Categorias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add Category */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Nome da categoria"
                        value={newCategory.nome}
                        onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
                      />
                      <input
                        type="color"
                        value={newCategory.cor}
                        onChange={(e) => setNewCategory({ ...newCategory, cor: e.target.value })}
                        className="w-full h-10 rounded-md border border-input"
                      />
                      <Select 
                        value={newCategory.tipo} 
                        onValueChange={(value: "receita" | "despesa") => setNewCategory({ ...newCategory, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleCreateCategory} disabled={!newCategory.nome}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>

                    <Separator />

                    {/* Categories List */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Income Categories */}
                        <div>
                          <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Receitas ({categories.filter((c: Category) => c.tipo === "receita").length})
                          </h3>
                          <div className="space-y-2">
                            {categories
                              .filter((category: Category) => category.tipo === "receita")
                              .map((category: Category) => (
                                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: category.cor }}
                                    />
                                    <span>{category.nome}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategory(category);
                                        setIsEditingCategory(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Expense Categories */}
                        <div>
                          <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Despesas ({categories.filter((c: Category) => c.tipo === "despesa").length})
                          </h3>
                          <div className="space-y-2">
                            {categories
                              .filter((category: Category) => category.tipo === "despesa")
                              .map((category: Category) => (
                                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: category.cor }}
                                    />
                                    <span>{category.nome}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategory(category);
                                        setIsEditingCategory(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Metas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category: Category) => {
                        const goal = getCategoryGoal(category.id);
                        return (
                          <Card key={category.id} className="relative">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: category.cor }}
                                  />
                                  <span className="font-medium">{category.nome}</span>
                                </div>
                                <Badge variant={category.tipo === "receita" ? "default" : "destructive"}>
                                  {category.tipo === "receita" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                  {category.tipo}
                                </Badge>
                              </div>
                              
                              {goal ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Meta Mensal</span>
                                    <span className="font-semibold">{formatCurrency(goal.monthlyGoal)}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all" 
                                      style={{ width: "45%" }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>45% atingido</span>
                                    <span>Este mês</span>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setIsGoalModalOpen(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Definir Meta
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">
                        {goals.filter((g: CategoryGoal) => g.isActive).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Metas Ativas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">73%</p>
                      <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">R$ 2.450</p>
                      <p className="text-sm text-muted-foreground">Economia Média</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingCategory.nome}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <input
                  type="color"
                  value={editingCategory.cor}
                  onChange={(e) => setEditingCategory({ ...editingCategory, cor: e.target.value })}
                  className="w-full h-10 rounded-md border border-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={editingCategory.tipo} 
                  onValueChange={(value: "receita" | "despesa") => setEditingCategory({ ...editingCategory, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditingCategory(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateCategory} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Meta Mensal</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedCategory.cor }}
                  />
                  <span className="font-medium">{selectedCategory.nome}</span>
                  <Badge variant={selectedCategory.tipo === "receita" ? "default" : "destructive"}>
                    {selectedCategory.tipo}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor da Meta Mensal</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {selectedCategory.tipo === "receita" 
                    ? "Meta de receita que deseja atingir mensalmente"
                    : "Limite máximo de despesas para esta categoria"
                  }
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsGoalModalOpen(false);
                    setSelectedCategory(null);
                    setGoalAmount("");
                  }} 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateGoal} className="flex-1" disabled={!goalAmount}>
                  Criar Meta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}