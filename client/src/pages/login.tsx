import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({
        title: "Erro no Login",
        description: error.message || "Erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">FinControle</CardTitle>
          <CardDescription>
            Controle suas finanças de forma simples e eficiente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSignIn}
            className="w-full"
            size="lg"
            disabled={isSigningIn}
          >
            {isSigningIn ? "Conectando..." : "Entrar com Google"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Acesse sua conta para começar a gerenciar suas finanças
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Se o popup não funcionar, tente recarregar a página ou usar outro navegador
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
