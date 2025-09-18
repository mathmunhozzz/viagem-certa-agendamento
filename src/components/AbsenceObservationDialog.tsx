import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, MessageSquare, Send } from 'lucide-react';

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
  const actionIcon = action === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />;
  const actionColor = action === 'approved' ? 'text-green-600' : 'text-red-600';
  const gradientClass = action === 'approved' 
    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
    : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-background to-muted/20 border border-muted/50 shadow-2xl animate-scale-in">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className={`flex items-center justify-center gap-3 text-2xl ${actionColor}`}>
            <div className={`p-3 rounded-full ${action === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {actionIcon}
            </div>
            {actionText} Ausência
          </DialogTitle>
          <DialogDescription className="text-base mt-4 leading-relaxed">
            Você está prestes a{' '}
            <span className={`font-bold ${actionColor}`}>
              {action === 'approved' ? 'aprovar' : 'rejeitar'}
            </span>{' '}
            a solicitação de ausência de{' '}
            <span className="font-bold text-foreground bg-primary/10 px-2 py-1 rounded">
              {employeeName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="observation" className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Observação {action === 'rejected' ? '(obrigatória)' : '(opcional)'}
            </Label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={
                action === 'approved' 
                  ? "Adicione uma observação sobre a aprovação, como orientações ou comentários..."
                  : "Explique detalhadamente o motivo da rejeição para que o funcionário entenda..."
              }
              className="min-h-[120px] resize-none border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              rows={5}
            />
            <div className="text-xs text-muted-foreground">
              {observation.length}/500 caracteres
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 h-12 border-2 hover:bg-muted/50 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (action === 'rejected' && !observation.trim())}
            className={`flex-1 h-12 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${gradientClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {actionText}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}