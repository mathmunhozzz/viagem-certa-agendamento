import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, MapPin, Users, FileText } from 'lucide-react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VehicleSelect } from './VehicleSelect';
import { SectorMultiSelect } from './SectorMultiSelect';
import { EmployeeMultiSelect } from './EmployeeMultiSelect';
import { ClientSelect } from './ClientSelect';
import { CreditCardSelect } from './CreditCardSelect';
import { Clock, Car } from 'lucide-react';

interface TripFormProps {
  onTripCreated: () => void;
}

export function TripForm({ onTripCreated }: TripFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [time, setTime] = useState<string>('08:00');
  const [travelers, setTravelers] = useState<string[]>(['']);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedCreditCard, setSelectedCreditCard] = useState<string>('');

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
    if (!user || !date || !selectedVehicle || selectedSectors.length === 0 || !selectedClient) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (incluindo o cliente).",
        variant: "destructive"
      });
      return;
    }

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
    const observations = formData.get('observations') as string;

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

      // Buscar nome do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', selectedClient)
        .single();

      if (clientError) throw clientError;

      // Determinar as datas para criar as viagens
      const datesToCreate = endDate && endDate > date 
        ? eachDayOfInterval({ start: date, end: endDate })
        : [date];

      // Criar viagem para cada data no intervalo
      const tripResults = [];
      for (const tripDate of datesToCreate) {
        const { data: result, error } = await supabase
          .from('trips')
          .insert({
            title,
            description,
            observations,
            trip_date: format(tripDate, 'yyyy-MM-dd'),
            departure_time: time,
            sector: sectorsData?.map(s => s.name).join(', '), // Nomes dos setores para compatibilidade
            sector_id: selectedSectors[0], // Primeira sector como referência principal
            travelers: validTravelers, // Apenas viajantes manuais
            employee_ids: selectedEmployees, // Apenas IDs dos funcionários
            client_id: selectedClient, // Cliente obrigatório
            created_by: user.id,
            vehicle_id: selectedVehicle,
            credit_card_id: selectedCreditCard || null // Cartão opcional
          })
          .select();

        if (error) throw error;
        tripResults.push(...result);
      }

      // Enviar notificações por email se houver funcionários selecionados
      if (selectedEmployees.length > 0) {
        try {
          // Enviar notificação para cada viagem criada
          for (const trip of tripResults) {
            const notificationData = {
              tripId: trip.id,
              title: title.trim(),
              description: description.trim() || undefined,
              tripDate: trip.trip_date,
              departureTime: time || undefined,
              client: clientData.name,
              sector: sectorsData?.map(s => s.name).join(', '),
              employeeIds: selectedEmployees
            };

            const { error: notificationError } = await supabase.functions.invoke(
              'send-trip-created-notification',
              { body: notificationData }
            );

            if (notificationError) {
              console.error('Failed to send notifications for trip:', trip.id, notificationError);
            }
          }

          const dateRange = endDate && endDate > date 
            ? `${format(date, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`
            : format(date, 'dd/MM/yyyy', { locale: ptBR });

          toast({
            title: "Viagem(ns) agendada(s) com sucesso!",
            description: `${tripResults.length} viagem(ns) criada(s) para "${title}" no período ${dateRange}.`,
          });
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          toast({
            title: "Viagem criada com avisos",
            description: "As viagens foram criadas, mas houve problemas ao enviar notificações por email.",
            variant: "destructive",
          });
        }
      } else {
        const dateRange = endDate && endDate > date 
          ? `${format(date, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`
          : format(date, 'dd/MM/yyyy', { locale: ptBR });

        toast({
          title: "Viagem(ns) agendada(s) com sucesso!",
          description: `${tripResults.length} viagem(ns) criada(s) para "${title}" no período ${dateRange}.`,
        });
      }

      // Reset form
      (e.target as HTMLFormElement).reset();
      setDate(undefined);
      setEndDate(undefined);
      setTime('08:00');
      setTravelers(['']);
      setSelectedVehicle('');
      setSelectedSectors([]);
      setSelectedEmployees([]);
      setSelectedClient('');
      setSelectedCreditCard('');
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
          {/* SEÇÃO 1: DATAS E HORÁRIO */}
          <div className="p-4 bg-gradient-to-r from-travel-primary/5 to-travel-primary/10 rounded-lg border border-travel-primary/20">
            <h3 className="text-sm font-semibold text-travel-primary mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Quando será a viagem?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Data de Início *</Label>
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
                      {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data de início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        // Se a data final for anterior à nova data inicial, ajustar
                        if (endDate && newDate && endDate < newDate) {
                          setEndDate(undefined);
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="bg-background border-0 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Data de Fim (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 border-travel-secondary/20 hover:border-travel-secondary hover:bg-travel-secondary/5",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={!date}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 text-travel-secondary" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data de fim (opcional)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ptBR}
                      disabled={(dateToCheck) => !date || dateToCheck < new Date(new Date().setHours(0, 0, 0, 0)) || dateToCheck < date}
                      className="bg-background border-0 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {endDate && date && (
                  <p className="text-sm text-travel-secondary">
                    Período: {eachDayOfInterval({ start: date, end: endDate }).length} dias
                  </p>
                )}
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
                  className="border-travel-accent/20 focus:border-travel-accent focus:ring-travel-accent/20 h-11"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: CLIENTE */}
          <div className="p-4 bg-gradient-to-r from-travel-secondary/5 to-travel-secondary/10 rounded-lg border border-travel-secondary/20">
            <h3 className="text-sm font-semibold text-travel-secondary mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Para qual cliente?
            </h3>
            <div className="space-y-4">
              <ClientSelect
                value={selectedClient}
                onValueChange={setSelectedClient}
              />
              <CreditCardSelect
                value={selectedCreditCard}
                onValueChange={setSelectedCreditCard}
              />
            </div>
          </div>

          {/* SEÇÃO 3: DETALHES DA VIAGEM */}
          <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border border-muted">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes da viagem
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Título da Viagem *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Reunião em São Paulo"
                  required
                  className="border-travel-primary/20 focus:border-travel-primary focus:ring-travel-primary/20 h-11"
                />
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

              <div className="space-y-2">
                <Label htmlFor="observations" className="text-sm font-semibold">Observações</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  placeholder="Observações ou instruções específicas para os funcionários..."
                  rows={3}
                  className="border-muted focus:border-travel-accent focus:ring-travel-accent/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: PARTICIPANTES */}
          <div className="p-4 bg-gradient-to-r from-travel-accent/5 to-travel-accent/10 rounded-lg border border-travel-accent/20">
            <h3 className="text-sm font-semibold text-travel-accent mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quem vai participar?
            </h3>
            <div className="space-y-4">
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
                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Viajante adicional {index + 1}
                        </Label>
                        <Input
                          placeholder={`Nome completo do viajante ${index + 1}`}
                          value={traveler}
                          onChange={(e) => updateTraveler(index, e.target.value)}
                          className="border-travel-secondary/20 focus:border-travel-secondary focus:ring-travel-secondary/20 h-11"
                         />
                       </div>
                       {travelers.length > 1 && (
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => removeTraveler(index)}
                           className="h-11 w-full sm:w-11 p-0 border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive"
                         >
                           <X className="h-4 w-4" />
                           <span className="ml-2 sm:hidden">Remover</span>
                         </Button>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>

          {/* SEÇÃO 5: LOGÍSTICA */}
          <div className="p-4 bg-gradient-to-r from-travel-warning/5 to-travel-warning/10 rounded-lg border border-travel-warning/20">
            <h3 className="text-sm font-semibold text-travel-warning mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Logística da viagem
            </h3>
            <VehicleSelect
              value={selectedVehicle}
              onValueChange={setSelectedVehicle}
              tripDate={date ? format(date, 'yyyy-MM-dd') : undefined}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-travel-primary to-travel-secondary hover:from-travel-primary-light hover:to-travel-secondary/90 text-white shadow-lg font-semibold text-base" 
            disabled={loading || !date || !selectedVehicle || selectedSectors.length === 0 || !selectedClient}
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