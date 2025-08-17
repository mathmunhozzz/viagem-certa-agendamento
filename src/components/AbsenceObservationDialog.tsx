import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from 'lucide-react';

interface AbsenceObservationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  absenceId: string;
  employeeName: string;
  action: 'approved' | 'rejected';
  onSuccess: () => void;
}

export function AbsenceObservationDialog({
  isOpen,
  onOpenChange,
  absenceId,
  employeeName,
  action,
  onSuccess
}: AbsenceObservationDialogProps) {
  const { toast } = useToast();
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_absences')
        .update({ 
          status: action,
          admin_observation: observation || null,
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', absenceId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Ausência ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
      setObservation('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da ausência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const actionText = action === 'approved' ? 'Aprovar' : 'Rejeitar';
  const actionIcon = action === 'approved' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />;
  const actionColor = action === 'approved' ? 'text-green-600' : 'text-red-600';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${actionColor}`}>
            {actionIcon}
            {actionText} Ausência
          </DialogTitle>
          <DialogDescription>
            Você está prestes a {action === 'approved' ? 'aprovar' : 'rejeitar'} a ausência de{' '}
            <span className="font-semibold">{employeeName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="observation">
              Observação {action === 'rejected' ? '(obrigatória)' : '(opcional)'}
            </Label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={
                action === 'approved' 
                  ? "Adicione uma observação sobre a aprovação (opcional)"
                  : "Explique o motivo da rejeição"
              }
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (action === 'rejected' && !observation.trim())}
            className={action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? 'Processando...' : actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}