
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TripNarrativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  employeeId?: string | null;
  initialContent?: string | null;
  onSaved?: (content: string) => void;
}

export function TripNarrativeDialog({
  open,
  onOpenChange,
  tripId,
  employeeId,
  initialContent,
  onSaved
}: TripNarrativeDialogProps) {
  const [content, setContent] = useState<string>(initialContent ?? '');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setContent(initialContent ?? '');
  }, [initialContent, open]);

  const handleSave = async () => {
    if (!employeeId) {
      toast({
        title: 'Funcionário não vinculado',
        description: 'Para relatar a viagem, vincule seu usuário a um funcionário.',
        variant: 'destructive',
      });
      return;
    }
    if (!content || content.trim().length === 0) {
      toast({
        title: 'Conteúdo vazio',
        description: 'Escreva o relato da viagem antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    // Usar any porque a tabela trip_reports ainda não está no arquivo de tipos gerado
    const { error } = await (supabase as any)
      .from('trip_reports')
      .upsert(
        [{ trip_id: tripId, employee_id: employeeId, content }],
        { onConflict: 'trip_id,employee_id' }
      );

    setSaving(false);

    if (error) {
      console.error('Erro ao salvar relato:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o relato. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Relato salvo',
      description: 'Seu relato da viagem foi salvo com sucesso.',
    });

    onSaved?.(content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Relatar viagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva aqui o relato detalhado da viagem..."
            className="min-h-[240px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar relato'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
