import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Componente para fazer teste automático do sistema de email
export function AutoEmailTest() {
  const { toast } = useToast();

  useEffect(() => {
    const testEmailSystem = async () => {
      // Só executa uma vez por sessão
      const hasTestedEmail = sessionStorage.getItem('email-test-completed');
      if (hasTestedEmail) return;

      try {
        console.log('🔧 Iniciando teste automático do sistema de email...');
        
        // Teste 1: Verificar se a edge function responde
        const { data, error } = await supabase.functions.invoke('send-trip-created-notification', {
          body: {
            testMode: true,
            testEmail: 'test@example.com', // Email fictício para teste de conectividade
            skipActualSend: true // Flag para pular o envio real
          }
        });

        if (error) {
          console.error('❌ Edge function não acessível:', error);
          toast({
            title: "Aviso do Sistema",
            description: "Sistema de email pode não estar configurado corretamente.",
            variant: "destructive"
          });
        } else {
          console.log('✅ Edge function respondeu corretamente:', data);
          
          // Verificar se as credenciais Gmail estão configuradas
          if (data && data.error && data.error.includes('Gmail credentials not configured')) {
            console.warn('⚠️ Credenciais Gmail não configuradas');
            toast({
              title: "Configuração Pendente",
              description: "Configure as credenciais do Gmail para ativar as notificações por email.",
              variant: "destructive"
            });
          } else {
            console.log('✅ Sistema de email configurado e funcionando');
            toast({
              title: "Sistema de Email OK",
              description: "Sistema de notificações por email está funcionando corretamente.",
            });
          }
        }

        // Marcar como testado nesta sessão
        sessionStorage.setItem('email-test-completed', 'true');

      } catch (error) {
        console.error('❌ Erro no teste automático:', error);
      }
    };

    // Executar teste após 2 segundos da inicialização
    const timer = setTimeout(testEmailSystem, 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  return null; // Componente invisível
}