import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema."
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80 dark:supports-[backdrop-filter]:bg-slate-950/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-travel-primary to-travel-secondary rounded-xl">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-travel-primary to-travel-secondary bg-clip-text text-transparent">
              Sistema de Viagens
            </h1>
            <p className="text-xs text-muted-foreground">Opportunity</p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-sm font-medium text-foreground block">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-travel-primary/20 hover:bg-travel-primary hover:text-white transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}