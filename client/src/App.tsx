import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Banks from "@/pages/banks";
import Income from "@/pages/income";
import Expenses from "@/pages/expenses";
import CreditCards from "@/pages/credit-cards";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user } = useAuth();

  // Set user ID header for all requests
  useEffect(() => {
    if (user) {
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          meta: {
            headers: {
              'user-id': user.uid
            }
          }
        },
        mutations: {
          ...queryClient.getDefaultOptions().mutations,
          meta: {
            headers: {
              'user-id': user.uid
            }
          }
        }
      });
    }
  }, [user]);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/banks" component={Banks} />
      <Route path="/income" component={Income} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/credit-cards" component={CreditCards} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
