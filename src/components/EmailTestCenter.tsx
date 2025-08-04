import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Bell, Clock, CheckCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const EmailTestCenter = () => {
  const [isTestingCreation, setIsTestingCreation] = useState(false);
  const [isTestingReminders, setIsTestingReminders] = useState(false);
  const [creationResult, setCreationResult] = useState<TestResult | null>(null);
  const [reminderResult, setReminderResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const testTripCreationEmail = async () => {
    setIsTestingCreation(true);
    setCreationResult(null);
    
    try {
      console.log('🧪 Testing trip creation email...');
      
      const { data, error } = await supabase.functions.invoke('send-trip-created-notification', {
        body: {
          testMode: true,
          testEmail: 'test@example.com' // Replace with actual test email
        }
      });

      if (error) {
        throw error;
      }

      setCreationResult({
        success: data.success,
        message: data.message || 'Email de criação de viagem enviado com sucesso!',
        details: data
      });

      if (data.success) {
        toast({
          title: "✅ Teste Bem-sucedido",
          description: "Email de criação de viagem enviado com sucesso!",
        });
      } else {
        toast({
          title: "❌ Teste Falhou",
          description: data.error || "Erro no envio do email",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Erro no teste de criação:', error);
      setCreationResult({
        success: false,
        message: error.message || 'Erro no teste de email de criação'
      });
      
      toast({
        title: "❌ Erro no Teste",
        description: error.message || "Falha no teste de email de criação",
        variant: "destructive"
      });
    } finally {
      setIsTestingCreation(false);
    }
  };

  const testTripReminderEmail = async () => {
    setIsTestingReminders(true);
    setReminderResult(null);
    
    try {
      console.log('🔔 Testing trip reminder emails...');
      
      const { data, error } = await supabase.functions.invoke('send-trip-notifications');

      if (error) {
        throw error;
      }

      setReminderResult({
        success: data.success,
        message: data.message || 'Processo de lembretes executado com sucesso!',
        details: data
      });

      if (data.success) {
        toast({
          title: "✅ Teste Bem-sucedido",
          description: `Processo de lembretes executado! ${data.summary?.emails_sent || 0} emails enviados.`,
        });
      } else {
        toast({
          title: "⚠️ Teste Executado",
          description: data.message || "Processo executado, verifique os logs para detalhes",
        });
      }

    } catch (error: any) {
      console.error('Erro no teste de lembretes:', error);
      setReminderResult({
        success: false,
        message: error.message || 'Erro no teste de lembretes'
      });
      
      toast({
        title: "❌ Erro no Teste",
        description: error.message || "Falha no teste de lembretes",
        variant: "destructive"
      });
    } finally {
      setIsTestingReminders(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Centro de Testes de Email
          </CardTitle>
          <CardDescription>
            Teste o sistema de notificações por email para verificar se está funcionando corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Teste de Email de Criação de Viagem */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium">Email de Criação de Viagem</h3>
              </div>
              <Button 
                onClick={testTripCreationEmail}
                disabled={isTestingCreation}
                size="sm"
                variant="outline"
              >
                {isTestingCreation ? "Testando..." : "Testar"}
              </Button>
            </div>
            
            {creationResult && (
              <div className={`p-3 rounded-lg border ${
                creationResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {creationResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{creationResult.message}</span>
                </div>
                {creationResult.details && (
                  <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                    {JSON.stringify(creationResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Teste de Email de Lembrete */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                <h3 className="font-medium">Lembretes de Viagem</h3>
              </div>
              <Button 
                onClick={testTripReminderEmail}
                disabled={isTestingReminders}
                size="sm"
                variant="outline"
              >
                {isTestingReminders ? "Testando..." : "Testar Lembretes"}
              </Button>
            </div>
            
            {reminderResult && (
              <div className={`p-3 rounded-lg border ${
                reminderResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {reminderResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{reminderResult.message}</span>
                </div>
                {reminderResult.details && (
                  <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                    {JSON.stringify(reminderResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Informações sobre Agendamento Automático */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-blue-800">Agendamento Automático</h3>
            </div>
            <p className="text-sm text-blue-700">
              <strong>Status:</strong> Em configuração - Os lembretes automáticos serão enviados diariamente às 18:00.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Para habilitar completamente, é necessário ativar a extensão pg_cron no Supabase.
            </p>
          </div>

          {/* Instruções */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Como funciona:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Email de Criação:</strong> Enviado imediatamente quando uma viagem é criada</li>
              <li>• <strong>Lembretes:</strong> Enviados automaticamente às 18:00 para viagens do dia seguinte</li>
              <li>• <strong>Logs:</strong> Todas as notificações são registradas na tabela notification_logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};