import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export function usePendingAbsences() {
  const { isAdmin } = useUserRole();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPendingCount = async () => {
    if (!isAdmin) {
      setPendingCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('employee_absences')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      setPendingCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar ausências pendentes:', error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  return { pendingCount, loading, refetch: fetchPendingCount };
}