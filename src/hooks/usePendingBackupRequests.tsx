import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export function usePendingBackupRequests() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPendingCount = async () => {
    if (!isAdmin) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count: pendingCount, error } = await supabase
        .from('backup_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      setCount(pendingCount || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem de backups pendentes:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      fetchPendingCount();
    }
  }, [isAdmin, roleLoading]);

  return { count, loading, refetch: fetchPendingCount };
}
