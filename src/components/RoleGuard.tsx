import { ReactNode } from 'react';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from './ui/alert';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  requiredRole: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

export function RoleGuard({ 
  requiredRole, 
  children, 
  fallback, 
  showError = true 
}: RoleGuardProps) {
  const { hasRole, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta área. Nível de acesso necessário: {requiredRole}.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}