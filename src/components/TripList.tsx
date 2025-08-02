
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, MoreVertical, Edit, Trash2, Car } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { EditTripDialog } from './EditTripDialog';

interface Trip {
  id: string;
  title: string;
  description: string;
  trip_date: string;
  departure_time: string;
  sector: string;
  travelers: string[];
  status: string;
  vehicle_id: string;
  sector_id: string;
  employee_ids: string[];
  employees?: Array<{
    id: string;
    name: string;
  }>;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    capacity: number;
  };
}

interface TripListProps {
  onTripUpdated: () => void;
}

export function TripList({ onTripUpdated }: TripListProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(id, brand, model, plate, capacity)
        `)
        .order('trip_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      // Buscar dados dos funcionários separadamente
      const tripsWithEmployees = await Promise.all(
        (data || []).map(async (trip) => {
          if (trip.employee_ids && trip.employee_ids.length > 0) {
            const { data: employees } = await supabase
              .from('employees')
              .select('id, name')
              .in('id', trip.employee_ids);
            
            return { ...trip, employees: employees || [] };
          }
          return { ...trip, employees: [] };
        })
      );
      
      setTrips(tripsWithEmployees);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string, tripTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a viagem "${tripTitle}"?`)) {
      return;
    }

    try {
      // Primeiro excluir notification_logs relacionados (sem gerar erro se não existir)
      const { error: logsError } = await supabase
        .from('notification_logs')
        .delete()
        .eq('trip_id', tripId);

      if (logsError) {
        console.warn('Aviso ao excluir logs:', logsError);
      }

      // Depois excluir a viagem
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      toast({
        title: "Viagem excluída",
        description: `A viagem "${tripTitle}" foi excluída com sucesso.`
      });

      onTripUpdated();
      fetchTrips();
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      toast({
        title: "Erro ao excluir",
        description: `Erro: ${error?.message || 'Não foi possível excluir a viagem'}`,
        variant: "destructive"
      });
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingTrip(null);
  };

  const handleTripUpdated = () => {
    fetchTrips();
    onTripUpdated();
  };

  const getStatusBadge = (trip: Trip) => {
    const tripDate = parseISO(trip.trip_date);
    
    if (isToday(tripDate)) {
      return (
        <Badge className="bg-travel-warning/20 text-travel-warning border-travel-warning/30">
          🟡 Hoje
        </Badge>
      );
    } else if (isFuture(tripDate)) {
      return (
        <Badge className="bg-travel-success/20 text-travel-success border-travel-success/30">
          🟢 Agendada
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted text-muted-foreground border-muted">
          ⚪ Concluída
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card className="travel-card travel-card-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-travel-primary" />
            Próximas Viagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="travel-card travel-card-dark animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-travel-primary" />
            Próximas Viagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.map((trip, index) => (
                <div
                  key={trip.id}
                  className="border rounded-xl p-5 bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-foreground break-words hyphens-auto overflow-wrap-anywhere">{trip.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="break-words">{format(parseISO(trip.trip_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(trip)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                          <DropdownMenuItem 
                            className="text-muted-foreground cursor-pointer"
                            onClick={() => handleEditTrip(trip)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer hover:bg-destructive/10"
                            onClick={() => deleteTrip(trip.id, trip.title)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {trip.description && (
                    <div className="mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
                      <p className="text-xs text-foreground break-words hyphens-auto leading-relaxed whitespace-pre-wrap word-break overflow-wrap-anywhere">
                        {trip.description}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-primary/10 text-travel-primary rounded-lg border border-travel-primary/20 min-w-0">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium break-words overflow-wrap-anywhere">{trip.sector}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-accent/10 text-travel-accent rounded-lg border border-travel-accent/20">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {(() => {
                          const totalTravelers = trip.travelers.length + (trip.employees?.length || 0);
                          return `${totalTravelers} pessoa${totalTravelers !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                    {trip.vehicle && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-secondary/10 text-travel-secondary rounded-lg border border-travel-secondary/20">
                        <Car className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {trip.vehicle.brand} {trip.vehicle.model} • {trip.vehicle.plate}
                        </span>
                      </div>
                    )}
                  </div>

                  {(trip.travelers.length > 0 || (trip.employees && trip.employees.length > 0)) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {/* Mostrar funcionários */}
                      {trip.employees?.slice(0, 3).map((employee, idx) => (
                        <Badge key={`emp-${idx}`} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800 break-words max-w-full">
                          <span className="break-words overflow-wrap-anywhere">👤 {employee.name}</span>
                        </Badge>
                      ))}
                      
                      {/* Mostrar viajantes manuais */}
                      {trip.travelers.slice(0, 3 - (trip.employees?.length || 0)).map((traveler, idx) => (
                        <Badge key={`trav-${idx}`} variant="outline" className="text-xs bg-background/80 break-words max-w-full">
                          <span className="break-words overflow-wrap-anywhere">{traveler}</span>
                        </Badge>
                      ))}
                      
                      {/* Mostrar +X mais se houver mais pessoas */}
                      {(() => {
                        const totalShown = Math.min(3, (trip.employees?.length || 0)) + Math.min(3 - (trip.employees?.length || 0), trip.travelers.length);
                        const totalPeople = (trip.employees?.length || 0) + trip.travelers.length;
                        if (totalPeople > totalShown) {
                          return (
                            <Badge variant="outline" className="text-xs bg-muted">
                              +{totalPeople - totalShown} mais
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium">Nenhuma viagem encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Comece agendando sua primeira viagem</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditTripDialog
        trip={editingTrip}
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onTripUpdated={handleTripUpdated}
      />
    </>
  );
}
