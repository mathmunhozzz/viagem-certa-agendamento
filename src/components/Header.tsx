import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plane, Shield, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header({ onShowUserManagement }: { onShowUserManagement?: () => void }) {
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Gerente';
      default: return 'Usuário';
    }
  };

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema."
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80 dark:supports-[backdrop-filter]:bg-slate-950/60 shadow-sm">
      <div className="container mx-auto px-4 flex h-14 md:h-16 items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <div className="flex items-center justify-center w-72 h-72 md:w-90 md:h-90 rounded-xl flex-shrink-0 p-2">
            <img 
              src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" 
              alt="Opportunity Sistemas Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-travel-primary to-travel-secondary bg-clip-text text-transparent truncate">
              Sistema de Viagens
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Opportunity</p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {role === 'admin' && onShowUserManagement && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowUserManagement}
                className="border-travel-primary/20 hover:bg-travel-primary hover:text-white transition-colors h-8 md:h-9 px-2 md:px-3"
              >
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Usuários</span>
              </Button>
            )}
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end space-x-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                {!roleLoading && (
                  <Badge variant={getRoleBadgeVariant()} className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel()}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground block">
                {user.email}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              className="border-travel-primary/20 hover:bg-travel-primary hover:text-white transition-colors h-8 md:h-9 px-2 md:px-3"
            >
              <LogOut className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}