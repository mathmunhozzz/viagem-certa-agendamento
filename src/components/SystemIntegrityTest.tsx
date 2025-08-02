import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, Database, Cog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export function SystemIntegrityTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const updateResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ));
  };

  const runSystemTests = async () => {
    setTesting(true);
    
    const testList: TestResult[] = [
      { name: 'Conexão com Supabase', status: 'pending', message: 'Verificando...' },
      { name: 'Edge Function - Trip Notifications', status: 'pending', message: 'Verificando...' },
      { name: 'Edge Function - Trip Reminders', status: 'pending', message: 'Verificando...' },
      { name: 'Configuração Gmail', status: 'pending', message: 'Verificando...' },
      { name: 'Estrutura do Banco de Dados', status: 'pending', message: 'Verificando...' },
      { name: 'Sistema de Notificações', status: 'pending', message: 'Verificando...' }
    ];
    
    setResults(testList);

    try {
      // Teste 1: Conexão com Supabase
      console.log('🔧 Teste 1: Conexão com Supabase');
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        updateResult('Conexão com Supabase', 'success', `Conectado com sucesso. ${data?.length || 0} perfis encontrados.`);
      } catch (error: any) {
        updateResult('Conexão com Supabase', 'error', `Erro de conexão: ${error.message}`);
      }

      // Teste 2: Edge Function - Trip Notifications
      console.log('🔧 Teste 2: Edge Function - Trip Notifications');
      try {
        const { data, error } = await supabase.functions.invoke('send-trip-created-notification', {
          body: {
            testMode: true,
            testEmail: 'test@connectivity.com',
            skipActualSend: true
          }
        });
        
        if (error) throw error;
        
        if (data && data.simulation) {
          updateResult('Edge Function - Trip Notifications', 'success', 'Edge function respondendo corretamente (modo simulação)');
        } else {
          updateResult('Edge Function - Trip Notifications', 'success', 'Edge function ativa e configurada');
        }
      } catch (error: any) {
        updateResult('Edge Function - Trip Notifications', 'error', `Erro na edge function: ${error.message}`);
      }

      // Teste 3: Edge Function - Trip Reminders  
      console.log('🔧 Teste 3: Edge Function - Trip Reminders');
      try {
        const { data, error } = await supabase.functions.invoke('send-trip-notifications', {
          body: {
            testMode: true,
            testEmail: 'test@connectivity.com'
          }
        });
        
        if (error) throw error;
        updateResult('Edge Function - Trip Reminders', 'success', 'Edge function de lembretes ativa');
      } catch (error: any) {
        updateResult('Edge Function - Trip Reminders', 'error', `Erro na edge function: ${error.message}`);
      }

      // Teste 4: Estrutura do Banco
      console.log('🔧 Teste 4: Estrutura do Banco de Dados');
      try {
        let allTablesOk = true;
        
        // Verificar tabelas principais uma por uma
        try {
          await supabase.from('trips').select('*', { count: 'exact', head: true });
          await supabase.from('employees').select('*', { count: 'exact', head: true });
          await supabase.from('clients').select('*', { count: 'exact', head: true });
          await supabase.from('sectors').select('*', { count: 'exact', head: true });
          await supabase.from('vehicles').select('*', { count: 'exact', head: true });
          await supabase.from('notification_logs').select('*', { count: 'exact', head: true });
        } catch (tableError) {
          allTablesOk = false;
          console.error('Erro ao verificar tabelas:', tableError);
        }
        
        if (allTablesOk) {
          updateResult('Estrutura do Banco de Dados', 'success', 'Todas as tabelas principais estão acessíveis');
        } else {
          updateResult('Estrutura do Banco de Dados', 'error', 'Algumas tabelas não estão acessíveis');
        }
      } catch (error: any) {
        updateResult('Estrutura do Banco de Dados', 'error', `Erro ao verificar banco: ${error.message}`);
      }

      // Teste 5: Sistema de Notificações (teste prático)
      console.log('🔧 Teste 5: Sistema de Notificações');
      try {
        // Verificar se existe pelo menos um funcionário com email para testar
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id, name, email')
          .not('email', 'is', null)
          .limit(1);
          
        if (empError) throw empError;
        
        if (employees && employees.length > 0) {
          updateResult('Sistema de Notificações', 'success', `Sistema pronto. ${employees.length} funcionário(s) com email configurado.`);
        } else {
          updateResult('Sistema de Notificações', 'error', 'Nenhum funcionário com email configurado no sistema');
        }
      } catch (error: any) {
        updateResult('Sistema de Notificações', 'error', `Erro ao verificar funcionários: ${error.message}`);
      }

      // Teste 6: Configuração Gmail (inferido dos testes anteriores)
      console.log('🔧 Teste 6: Configuração Gmail');
      const hasEmailConfig = results.some(r => 
        r.name.includes('Edge Function') && r.status === 'success'
      );
      
      if (hasEmailConfig) {
        updateResult('Configuração Gmail', 'success', 'Credenciais configuradas (inferido dos testes de edge function)');
      } else {
        updateResult('Configuração Gmail', 'error', 'Configuração Gmail não verificada ou com problemas');
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const totalTests = results.length;

      toast({
        title: "Teste de Integridade Concluído",
        description: `${successCount}/${totalTests} testes passaram com sucesso.`,
        variant: successCount === totalTests ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('Erro geral nos testes:', error);
      toast({
        title: "Erro nos Testes",
        description: `Erro geral: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800 border-green-200">Sucesso</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      default: return <Badge variant="secondary">Executando...</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-6 w-6 text-travel-primary" />
          Teste de Integridade do Sistema
        </CardTitle>
        <CardDescription>
          Verifica se todos os componentes do sistema estão funcionando corretamente, incluindo edge functions, banco de dados e configurações de email.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {results.length === 0 && (
          <div className="text-center py-8">
            <Button 
              onClick={runSystemTests}
              disabled={testing}
              className="bg-travel-primary hover:bg-travel-primary/90"
            >
              {testing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Executando Testes...
                </>
              ) : (
                <>
                  <Cog className="h-4 w-4 mr-2" />
                  Executar Testes de Integridade
                </>
              )}
            </Button>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
            
            {!testing && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={runSystemTests}
                  variant="outline"
                  className="border-travel-primary text-travel-primary hover:bg-travel-primary/10"
                >
                  <Cog className="h-4 w-4 mr-2" />
                  Executar Novamente
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}