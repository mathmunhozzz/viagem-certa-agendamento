
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurrentEmployee {
  id: string;
  name: string;
  email?: string | null;
  position?: string | null;
  auth_user_id?: string | null;
}

export function useCurrentEmployee() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEmployee = async () => {
    if (!user) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, position, auth_user_id')
      .eq('auth_user_id', user.id);

    if (error) {
      console.error('Erro ao buscar funcionário do usuário atual:', error);
      setEmployee(null);
    } else {
      setEmployee(data?.[0] ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { employee, loading, refetch: fetchEmployee };
}
