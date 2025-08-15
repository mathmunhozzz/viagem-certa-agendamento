import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VehicleSelect } from './VehicleSelect';
import { SectorMultiSelect } from './SectorMultiSelect';
import { EmployeeMultiSelect } from './EmployeeMultiSelect';
import { CreditCardSelect } from './CreditCardSelect';

interface Trip {
  id: string;
  title: string;
  description: string;
  observations?: string;
  trip_date: string;
  departure_time: string;
  sector: string;
  travelers: string[];
  vehicle_id: string;
  sector_id: string;
  employee_ids: string[];
  credit_card_id?: string;
}

interface EditTripDialogProps {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

export function EditTripDialog({ trip, open, onClose, onTripUpdated }: EditTripDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    observations: '',
    trip_date: '',
    departure_time: '08:00',
    travelers: [''],
    vehicle_id: '',
    sector_id: '',
    employee_ids: [] as string[],
    credit_card_id: ''
  });

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (trip) {
      setFormData({
        title: trip.title || '',
        description: trip.description || '',
        observations: trip.observations || '',
        trip_date: trip.trip_date,
        departure_time: trip.departure_time || '08:00',
        travelers: trip.travelers.length > 0 ? trip.travelers : [''],
        vehicle_id: trip.vehicle_id || '',
        sector_id: trip.sector_id || '',
        employee_ids: trip.employee_ids || [],
        credit_card_id: trip.credit_card_id || ''
      });
      setSelectedSectors(trip.sector_id ? [trip.sector_id] : []);
      setSelectedEmployees(trip.employee_ids || []);
    }
  }, [trip]);

  const handleSectorToggle = (sectorId: string, checked: boolean) => {
    const newSectors = checked
      ? [...selectedSectors, sectorId]
      : selectedSectors.filter(id => id !== sectorId);

    setSelectedSectors(newSectors);
    setFormData(prev => ({ ...prev, sector_id: newSectors[0] || '' }));
  };

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    const newEmployees = checked
      ? [...selectedEmployees, employeeId]
      : selectedEmployees.filter(id => id !== employeeId);

    setSelectedEmployees(newEmployees);
    setFormData(prev => ({ ...prev, employee_ids: newEmployees }));
  };

  const addTraveler = () => {
    setFormData(prev => ({ ...prev, travelers: [...prev.travelers, ''] }));
  };

  const removeTraveler = (index: number) => {
    if (formData.travelers.length > 1) {
      setFormData(prev => ({
        ...prev,
        travelers: prev.travelers.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTraveler = (index: number, value: string) => {
    const newTravelers = [...formData.travelers];
    newTravelers[index] = value;
    setFormData(prev => ({ ...prev, travelers: newTravelers }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    setLoading(true);

    try {
      // Buscar nomes dos setores
      const { data: sectorsData, error: sectorsError } = await supabase
        .from('sectors')
        .select('name')
        .in('id', selectedSectors);

      if (sectorsError) throw sectorsError;

      const validTravelers = formData.travelers.filter(t => t.trim() !== '');

      const { error } = await supabase
        .from('trips')
        .update({
          title: formData.title,
          description: formData.description,
          observations: formData.observations,
          trip_date: formData.trip_date,
          departure_time: formData.departure_time,
          sector: sectorsData?.map(s => s.name).join(', ') || '',
          sector_id: formData.sector_id || null,
          travelers: validTravelers,
          employee_ids: formData.employee_ids,
          vehicle_id: formData.vehicle_id || null,
          credit_card_id: formData.credit_card_id || null
        })
        .eq('id', trip.id);

      if (error) throw error;

      toast({
        title: 'Viagem atualizada',
        description: 'A viagem foi atualizada com sucesso.'
      });

      onTripUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a viagem. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-travel-primary" />
            Editar Viagem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data e Horário */}
          <div className="p-3 bg-travel-primary/5 rounded-lg border border-travel-primary/20">
            <h4 className="text-sm font-semibold text-travel-primary mb-3">Data e Horário</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Viagem *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.trip_date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.trip_date
                        ? format(parseISO(formData.trip_date), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.trip_date ? parseISO(formData.trip_date) : undefined}
                      onSelect={(date) =>
                        setFormData(prev => ({
                          ...prev,
                          trip_date: date ? format(date, 'yyyy-MM-dd') : ''
                        }))
                      }
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário de Saída *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Detalhes da Viagem */}
          <div className="p-3 bg-muted/30 rounded-lg border border-muted">
            <h4 className="text-sm font-semibold mb-3">Detalhes da Viagem</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Viagem *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="p-3 bg-travel-accent/5 rounded-lg border border-travel-accent/20">
            <h4 className="text-sm font-semibold text-travel-accent mb-3">Participantes</h4>
            <div className="space-y-4">
              <SectorMultiSelect
                selectedSectors={selectedSectors}
                onSectorToggle={handleSectorToggle}
              />

              <EmployeeMultiSelect
                selectedSectors={selectedSectors}
                selectedEmployees={selectedEmployees}
                onEmployeeToggle={handleEmployeeToggle}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Viajantes Adicionais</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTraveler}>
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.travelers.map((traveler, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder={`Viajante ${index + 1}`}
                        value={traveler}
                        onChange={(e) => updateTraveler(index, e.target.value)}
                      />
                      {formData.travelers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTraveler(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Veículo e Cartão */}
          <div className="p-3 bg-travel-warning/5 rounded-lg border border-travel-warning/20">
            <h4 className="text-sm font-semibold text-travel-warning mb-3">Veículo e Cartão de Crédito</h4>
            <div className="space-y-4">
              <VehicleSelect
                value={formData.vehicle_id || undefined}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                tripDate={formData.trip_date}
              />
              <CreditCardSelect
                value={formData.credit_card_id || undefined} // evita "" vazio
                onValueChange={(value) => setFormData(prev => ({ ...prev, credit_card_id: value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
