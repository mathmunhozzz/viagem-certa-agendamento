import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, MapPin, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VehicleSelect } from './VehicleSelect';
import { SectorMultiSelect } from './SectorMultiSelect';
import { EmployeeMultiSelect } from './EmployeeMultiSelect';
import { Clock } from 'lucide-react';

interface TripFormProps {
  onTripCreated: () => void;
}

export function TripForm({ onTripCreated }: TripFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('08:00');
  const [travelers, setTravelers] = useState<string[]>(['']);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

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

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const handleSectorToggle = (sectorId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectors([...selectedSectors, sectorId]);
    } else {
      setSelectedSectors(selectedSectors.filter(id => id !== sectorId));
      // Remover funcionários do setor desmarcado
      setSelectedEmployees(selectedEmployees.filter(empId => {
        // Esta lógica será refinada quando buscarmos os funcionários
        return true;
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !date || !selectedVehicle || selectedSectors.length === 0) return;

    // Verificar se pelo menos um funcionário foi selecionado ou se há viajantes manuais
    const validTravelers = travelers.filter(t => t.trim() !== '');
    if (selectedEmployees.length === 0 && validTravelers.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um funcionário ou adicione um viajante.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    try {
      // Buscar os nomes dos setores selecionados
      const { data: sectorsData, error: sectorsError } = await supabase
        .from('sectors')
        .select('name')
        .in('id', selectedSectors);

      if (sectorsError) throw sectorsError;

      // Buscar nomes dos funcionários selecionados
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('name')
        .in('id', selectedEmployees);

      if (employeesError) throw employeesError;

      // Apenas viajantes manuais vão para o campo travelers
      // Funcionários ficam apenas no employee_ids
      const { error } = await supabase
        .from('trips')
        .insert({
          title,
          description,
          trip_date: format(date, 'yyyy-MM-dd'),
          departure_time: time,
          sector: sectorsData?.map(s => s.name).join(', '), // Nomes dos setores para compatibilidade
          sector_id: selectedSectors[0], // Primeira sector como referência principal
          travelers: validTravelers, // Apenas viajantes manuais
          employee_ids: selectedEmployees, // Apenas IDs dos funcionários
          created_by: user.id,
          vehicle_id: selectedVehicle
        });

      if (error) throw error;

      toast({
        title: "Viagem agendada com sucesso!",
        description: `A viagem "${title}" foi criada para ${format(date, 'dd/MM/yyyy', { locale: ptBR })}.`
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
      setDate(undefined);
      setTime('08:00');
      setTravelers(['']);
      setSelectedVehicle('');
      setSelectedSectors([]);
      setSelectedEmployees([]);
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
    <Card className="travel-card travel-card-dark animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-travel-secondary to-travel-primary rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Agendar Nova Viagem</CardTitle>
            <CardDescription className="text-base">
              Preencha os dados da viagem para adicionar ao calendário
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-travel-primary" />
                Título da Viagem *
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Reunião em São Paulo"
                required
                className="border-travel-primary/20 focus:border-travel-primary focus:ring-travel-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-travel-accent" />
                Horário de Saída *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="border-travel-accent/20 focus:border-travel-accent focus:ring-travel-accent/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalhes sobre a viagem, objetivo, local de destino..."
              rows={3}
              className="border-muted focus:border-travel-secondary focus:ring-travel-secondary/20 resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Data da Viagem *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 border-travel-primary/20 hover:border-travel-primary hover:bg-travel-primary/5",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-travel-primary" />
                  {date ? format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data da viagem"}
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
                  className="bg-background border-0"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seleção de Setores */}
          <SectorMultiSelect
            selectedSectors={selectedSectors}
            onSectorToggle={handleSectorToggle}
          />

          {/* Seleção de Funcionários */}
          <EmployeeMultiSelect
            selectedSectors={selectedSectors}
            selectedEmployees={selectedEmployees}
            onEmployeeToggle={handleEmployeeToggle}
          />

          {/* Viajantes Adicionais (Opcional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-travel-secondary" />
                Viajantes Adicionais (Opcional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTraveler}
                className="h-8 border-travel-secondary/30 hover:border-travel-secondary hover:bg-travel-secondary/10 text-travel-secondary"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Adicione viajantes que não estão cadastrados no sistema ou externos à empresa
            </p>
            <div className="space-y-3">
              {travelers.map((traveler, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Viajante adicional {index + 1}
                    </Label>
                    <Input
                      placeholder={`Nome completo do viajante ${index + 1}`}
                      value={traveler}
                      onChange={(e) => updateTraveler(index, e.target.value)}
                      className="border-travel-secondary/20 focus:border-travel-secondary focus:ring-travel-secondary/20"
                    />
                  </div>
                  {travelers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTraveler(index)}
                      className="h-10 w-10 p-0 border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <VehicleSelect
            value={selectedVehicle}
            onValueChange={setSelectedVehicle}
            tripDate={date ? format(date, 'yyyy-MM-dd') : undefined}
            error={!selectedVehicle && loading ? 'Selecione um veículo' : undefined}
          />

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-travel-primary to-travel-secondary hover:from-travel-primary-light hover:to-travel-secondary/90 text-white shadow-lg font-semibold text-base" 
            disabled={loading || !date || !selectedVehicle || selectedSectors.length === 0}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Agendando...
              </div>
            ) : "Agendar Viagem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}