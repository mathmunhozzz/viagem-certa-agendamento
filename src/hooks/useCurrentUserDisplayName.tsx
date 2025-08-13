
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useCurrentUserDisplayName() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('Usuário');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setDisplayName('Usuário');
        setLoading(false);
        return;
      }

      // 1) Tenta perfis
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id);

      if (!error && data && data[0]?.name) {
        setDisplayName(data[0].name);
        setLoading(false);
        return;
      }

      // 2) Fallback para user_metadata
      const metaName = (user.user_metadata as any)?.name as string | undefined;
      if (metaName && metaName.trim().length > 0) {
        setDisplayName(metaName);
        setLoading(false);
        return;
      }

      // 3) Fallback para email
      const emailName = user.email ? user.email.split('@')[0] : 'Usuário';
      setDisplayName(emailName);
      setLoading(false);
    };

    load();
  }, [user]);

  return { displayName, loading };
}
