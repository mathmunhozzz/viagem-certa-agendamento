import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAccountStatus = () => {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAccountStatus();
    } else {
      setAccountStatus(null);
      setLoading(false);
    }
  }, [user]);

  const checkAccountStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar status da conta:', error);
        setAccountStatus('pending');
      } else {
        setAccountStatus(data?.account_status || 'pending');
      }
    } catch (error) {
      console.error('Erro ao verificar status da conta:', error);
      setAccountStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  return {
    accountStatus,
    loading,
    isApproved: accountStatus === 'approved',
    isPending: accountStatus === 'pending',
    isRejected: accountStatus === 'rejected',
    refetch: checkAccountStatus
  };
};