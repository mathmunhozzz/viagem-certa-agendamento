import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TripFormProps {
  onTripCreated: () => void;
}

export function TripForm({ onTripCreated }: TripFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [travelers, setTravelers] = useState<string[]>(['']);

  const addTraveler = () => {
    setTravelers([...travelers, '']);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  const updateTraveler = (index: number, value: string) => {
    const newTravelers = [...travelers];
    newTravelers[index] = value;
    setTravelers(newTravelers);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !date) return;

    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const sector = formData.get('sector') as string;
    
    const validTravelers = travelers.filter(t => t.trim() !== '');

    try {
      const { error } = await supabase
        .from('trips')
        .insert({
          title,
          description,
          trip_date: format(date, 'yyyy-MM-dd'),
          sector,
          travelers: validTravelers,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Viagem agendada com sucesso!",
        description: `A viagem "${title}" foi criada para ${format(date, 'dd/MM/yyyy', { locale: ptBR })}.`
      });

      // Reset form
      e.currentTarget.reset();
      setDate(undefined);
      setTravelers(['']);
      onTripCreated();

    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      toast({
        title: "Erro ao agendar viagem",
        description: "Ocorreu um erro ao criar a viagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Nova Viagem</CardTitle>
        <CardDescription>
          Preencha os dados da viagem para adicionar ao calendário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Viagem *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Reunião em São Paulo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Setor *</Label>
              <Input
                id="sector"
                name="sector"
                placeholder="Ex: Vendas, TI, Administrativo"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalhes sobre a viagem..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Data da Viagem *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={ptBR}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Viajantes *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTraveler}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {travelers.map((traveler, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Nome do viajante ${index + 1}`}
                    value={traveler}
                    onChange={(e) => updateTraveler(index, e.target.value)}
                    required={index === 0}
                  />
                  {travelers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTraveler(index)}
                      className="h-10 w-10 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !date}>
            {loading ? "Agendando..." : "Agendar Viagem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}