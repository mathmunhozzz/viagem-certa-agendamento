import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';  
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';

interface AbsenceFormProps {
  onAbsenceCreated: () => void;
}

export function AbsenceForm({ onAbsenceCreated }: AbsenceFormProps) {
  const { toast } = useToast();
  const { employee } = useCurrentEmployee();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar vinculado a um funcionário para solicitar ausência.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !reason.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('employee_absences')
        .insert({
          employee_id: employee.id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          reason: reason.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação de ausência cadastrada com sucesso!",
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      onAbsenceCreated();

    } catch (error) {
      console.error('Erro ao cadastrar ausência:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar ausência. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Solicitar Ausência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Você precisa estar vinculado a um funcionário para solicitar ausências.
            Entre em contato com o administrador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Solicitar Ausência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      // Se a data final for anterior à nova data inicial, ajustar
                      if (endDate && date && endDate < date) {
                        setEndDate(undefined);
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final (opcional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => !startDate || date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da ausência..."
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Solicitar Ausência'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}