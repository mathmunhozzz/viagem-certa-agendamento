import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, X, Link } from 'lucide-react';

interface BackupRequest {
  id: string;
  city_name: string;
  reason: string;
  user_id: string;
}

interface BackupRequestResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BackupRequest | null;
  onSuccess: () => void;
}

export function BackupRequestResponseDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: BackupRequestResponseDialogProps) {
  const { user } = useAuth();
  const [observation, setObservation] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResponse = async (approved: boolean) => {
    if (!request || !user) return;

    if (approved && !downloadLink.trim()) {
      toast.error('Informe o link de download do backup');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('backup_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          admin_observation: observation.trim() || null,
          download_link: approved ? downloadLink.trim() : null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(approved ? 'Backup aprovado com sucesso!' : 'Solicitação rejeitada');
      setObservation('');
      setDownloadLink('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao responder solicitação:', error);
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Responder Solicitação de Backup</DialogTitle>
          <DialogDescription>
            Cidade: <strong>{request?.city_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Motivo da solicitação:</p>
            <p className="text-sm text-muted-foreground">{request?.reason}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downloadLink" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link de Download (obrigatório para aprovar)
            </Label>
            <Input
              id="downloadLink"
              placeholder="https://exemplo.com/backup.zip"
              value={downloadLink}
              onChange={(e) => setDownloadLink(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação (opcional)</Label>
            <Textarea
              id="observation"
              placeholder="Adicione uma observação se necessário..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={() => handleResponse(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            onClick={() => handleResponse(true)}
            disabled={loading || !downloadLink.trim()}
          >
            <Check className="h-4 w-4 mr-2" />
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
