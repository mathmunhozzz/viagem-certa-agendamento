import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, TestTube, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function EmailTestButton() {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const testTripCreatedNotification = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido para teste.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Criar dados de teste para uma viagem fictícia
      const testData = {
        tripId: 'test-trip-' + Date.now(),
        title: 'Viagem de Teste - Gmail SMTP',
        description: 'Esta é uma viagem de teste para verificar se o sistema de notificações por email está funcionando corretamente.',
        tripDate: new Date().toISOString().split('T')[0],
        departureTime: '09:00',
        client: 'Cliente de Teste',
        sector: 'Setor de Teste',
        employeeIds: [] // Vamos usar um email manual para teste
      };

      console.log('Testando envio de notificação...');
      
      // Simular o envio direto para o edge function com email de teste
      const { data, error } = await supabase.functions.invoke('send-trip-created-notification', {
        body: {
          ...testData,
          // Adicionar dados específicos do teste
          testMode: true,
          testEmail: testEmail.trim()
        }
      });

      if (error) {
        throw error;
      }

      console.log('Resposta do teste:', data);
      
      toast({
        title: "Teste de Email Enviado!",
        description: `Email de teste enviado para ${testEmail}. Verifique sua caixa de entrada.`,
      });

      setOpen(false);
      setTestEmail('');

    } catch (error) {
      console.error('Erro no teste de email:', error);
      toast({
        title: "Erro no Teste de Email",
        description: `Falha ao enviar email de teste: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testTripReminder = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Erro", 
        description: "Por favor, insira um email válido para teste.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Testando edge function de lembretes...');
      
      const { data, error } = await supabase.functions.invoke('send-trip-notifications', {
        body: {
          testMode: true,
          testEmail: testEmail.trim()
        }
      });

      if (error) {
        throw error;
      }

      console.log('Resposta do teste de lembrete:', data);
      
      toast({
        title: "Teste de Lembrete Enviado!",
        description: `Lembrete de teste enviado para ${testEmail}. Verifique sua caixa de entrada.`,
      });

      setOpen(false);
      setTestEmail('');

    } catch (error) {
      console.error('Erro no teste de lembrete:', error);
      toast({
        title: "Erro no Teste de Lembrete",
        description: `Falha ao enviar lembrete de teste: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-travel-accent text-travel-accent hover:bg-travel-accent/10"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Testar Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-travel-primary" />
            Teste de Sistema de Email
          </DialogTitle>
          <DialogDescription>
            Teste se o sistema de notificações por Gmail SMTP está funcionando corretamente.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configurar Teste</CardTitle>
            <CardDescription>
              Insira um email válido para receber as notificações de teste.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email para Teste</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="border-travel-primary/20 focus:border-travel-primary"
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Button
                onClick={testTripCreatedNotification}
                disabled={loading || !testEmail.trim()}
                className="w-full bg-travel-primary hover:bg-travel-primary/90"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Testar Notificação de Viagem Criada
              </Button>
              
              <Button
                onClick={testTripReminder}
                disabled={loading || !testEmail.trim()}
                variant="outline"
                className="w-full border-travel-secondary text-travel-secondary hover:bg-travel-secondary/10"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Testar Lembrete de Viagem
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}