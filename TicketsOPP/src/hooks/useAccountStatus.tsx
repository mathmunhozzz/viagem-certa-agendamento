import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAccountStatus() {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountStatus = async () => {
      if (!user) {
        setAccountStatus(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('account_status')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setAccountStatus(data?.account_status || 'pending');
      } catch (error) {
        console.error('Error fetching account status:', error);
        setAccountStatus('pending');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountStatus();
  }, [user]);

  return { accountStatus, loading };
}