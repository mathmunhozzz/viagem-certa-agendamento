import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';  
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Send, AlertCircle, User } from 'lucide-react';
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
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-muted/50 shadow-xl animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            Solicitar Ausência
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Perfil não vinculado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Você precisa estar vinculado a um funcionário para solicitar ausências.
                Entre em contato com o administrador para fazer essa vinculação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-muted/50 shadow-xl animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold">Solicitar Ausência</div>
            <div className="text-sm font-normal text-muted-foreground mt-1">
              Funcionário: <span className="font-semibold text-primary">{employee.name}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Data de Início *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-2 transition-all duration-200",
                      !startDate && "text-muted-foreground",
                      "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data de início"}
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

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-secondary" />
                Data de Fim (Opcional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-2 transition-all duration-200",
                      !endDate && "text-muted-foreground",
                      !startDate && "opacity-50 cursor-not-allowed",
                      "hover:border-secondary/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
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

          <div className="space-y-3">
            <Label htmlFor="reason" className="text-sm font-semibold text-foreground">
              Motivo da Ausência *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva detalhadamente o motivo da sua ausência. Seja claro e específico para facilitar a análise do administrador..."
              rows={5}
              required
              className="resize-none border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <div className="text-xs text-muted-foreground">
              {reason.length}/500 caracteres
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !startDate || !reason.trim()}
            className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                Enviando solicitação...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Solicitar Ausência
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}