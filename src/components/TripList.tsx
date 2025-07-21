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

interface Trip {
  id: string;
  title: string;
  description: string;
  trip_date: string;
  sector: string;
  travelers: string[];
  status: string;
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
      setTrips(data || []);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string, tripTitle: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

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
        description: "Não foi possível excluir a viagem. Tente novamente.",
        variant: "destructive"
      });
    }
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
                className="border rounded-xl p-5 bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-foreground">{trip.title}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(trip.trip_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
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
                        <DropdownMenuItem className="text-muted-foreground cursor-pointer">
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
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {trip.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-primary/10 text-travel-primary rounded-lg border border-travel-primary/20">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">{trip.sector}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-accent/10 text-travel-accent rounded-lg border border-travel-accent/20">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {trip.travelers.length} pessoa{trip.travelers.length !== 1 ? 's' : ''}
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

                {trip.travelers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {trip.travelers.slice(0, 3).map((traveler, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-background/80">
                        {traveler}
                      </Badge>
                    ))}
                    {trip.travelers.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-muted">
                        +{trip.travelers.length - 3} mais
                      </Badge>
                    )}
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
  );
}