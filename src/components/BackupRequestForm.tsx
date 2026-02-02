import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Database, Send } from 'lucide-react';

interface BackupRequestFormProps {
  onSuccess?: () => void;
}

export function BackupRequestForm({ onSuccess }: BackupRequestFormProps) {
  const { user } = useAuth();
  const [cityName, setCityName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para solicitar backup');
      return;
    }

    if (!cityName.trim()) {
      toast.error('Informe o nome da cidade');
      return;
    }

    if (!systemName.trim()) {
      toast.error('Informe o nome do sistema');
      return;
    }

    if (!reason.trim()) {
      toast.error('Informe o motivo da solicitação');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('backup_requests').insert({
        user_id: user.id,
        city_name: cityName.trim(),
        system_name: systemName.trim(),
        reason: reason.trim(),
      });

      if (error) throw error;

      toast.success('Solicitação de backup enviada com sucesso!');
      setCityName('');
      setSystemName('');
      setReason('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao solicitar backup:', error);
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Solicitar Backup
        </CardTitle>
        <CardDescription>
          Solicite o backup do banco de dados de uma cidade específica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cityName">Cidade *</Label>
            <Input
              id="cityName"
              placeholder="Digite o nome da cidade"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemName">Sistema *</Label>
            <Input
              id="systemName"
              placeholder="Ex: Sistema de Vendas, ERP, etc."
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Solicitação *</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo pelo qual você precisa deste backup..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
