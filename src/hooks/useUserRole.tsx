import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'manager' | 'user';

interface UserRoleHook {
  role: UserRole;
  loading: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  refreshRole: () => Promise<void>;
}

export function useUserRole(): UserRoleHook {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user) {
      setRole('user');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { check_user_id: user.id });

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } else {
        setRole(data || 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      manager: 2,
      admin: 3
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const refreshRole = async () => {
    setLoading(true);
    await fetchUserRole();
  };

  return {
    role,
    loading,
    hasRole,
    isAdmin: role === 'admin',
    isManager: hasRole('manager'),
    refreshRole
  };
}