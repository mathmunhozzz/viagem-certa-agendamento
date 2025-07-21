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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Plane className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Sistema de Viagens</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Olá, {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}