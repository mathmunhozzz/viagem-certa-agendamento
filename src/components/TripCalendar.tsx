import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Trip {
  id: string;
  title: string;
  description: string;
  trip_date: string;
  sector: string;
  travelers: string[];
  status: string;
}

export function TripCalendar() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('trip_date', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTripsForDate = (date: Date) => {
    return trips.filter(trip => 
      isSameDay(parseISO(trip.trip_date), date)
    );
  };

  const selectedDateTrips = selectedDate ? getTripsForDate(selectedDate) : [];

  const tripDates = trips.map(trip => parseISO(trip.trip_date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <Card className="travel-card travel-card-dark">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-travel-primary to-travel-accent rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            Calendário de Viagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border w-full bg-background/50 backdrop-blur-sm"
            locale={ptBR}
            modifiers={{
              hasTrip: tripDates
            }}
            modifiersStyles={{
              hasTrip: {
                backgroundColor: 'hsl(var(--travel-primary))',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px'
              }
            }}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div className="w-3 h-3 bg-travel-primary rounded-full"></div>
            <span>Dias com viagens agendadas</span>
          </div>
        </CardContent>
      </Card>

      <Card className="travel-card travel-card-dark">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-travel-secondary to-travel-accent rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            Viagens do Dia
          </CardTitle>
          <p className="text-muted-foreground">
            {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-travel-primary mx-auto"></div>
              <p className="mt-3 text-sm text-muted-foreground">Carregando viagens...</p>
            </div>
          ) : selectedDateTrips.length > 0 ? (
            <div className="space-y-4">
              {selectedDateTrips.map((trip, index) => (
                <div key={trip.id} className="border rounded-xl p-5 bg-gradient-to-br from-background to-muted/30 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-foreground">{trip.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        trip.status === 'scheduled' ? 'bg-travel-success/10 text-travel-success border-travel-success/20' :
                        trip.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-travel-warning/10 text-travel-warning border-travel-warning/20'
                      }`}
                    >
                      {trip.status === 'scheduled' ? 'Agendada' : 
                       trip.status === 'cancelled' ? 'Cancelada' : 'Em Andamento'}
                    </Badge>
                  </div>
                  {trip.description && (
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{trip.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-primary/10 text-travel-primary rounded-lg border border-travel-primary/20">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="font-medium">{trip.sector}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-travel-accent/10 text-travel-accent rounded-lg border border-travel-accent/20">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {trip.travelers.length} viajante{trip.travelers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {trip.travelers.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        Viajantes:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {trip.travelers.map((traveler, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-background/80">
                            {traveler}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">Nenhuma viagem agendada</p>
              <p className="text-sm text-muted-foreground mt-1">Selecione outra data ou agende uma nova viagem</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}