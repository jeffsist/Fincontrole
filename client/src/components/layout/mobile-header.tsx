import { Menu, UserCircle } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-background border-b border-border fixed top-0 left-0 right-0 z-50 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={onMenuToggle} 
          className="text-foreground p-1 hover:bg-accent rounded-md transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground">FinControle</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button 
            onClick={handleSignOut} 
            className="text-foreground p-1 hover:bg-accent rounded-md transition-colors"
            aria-label="Sair da conta"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
