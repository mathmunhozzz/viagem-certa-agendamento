import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border w-full"
            locale={ptBR}
            modifiers={{
              hasTrip: tripDates
            }}
            modifiersStyles={{
              hasTrip: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Viagens - {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : selectedDateTrips.length > 0 ? (
            <div className="space-y-4">
              {selectedDateTrips.map((trip) => (
                <div key={trip.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-card-foreground">{trip.title}</h3>
                    <Badge variant="secondary">{trip.status}</Badge>
                  </div>
                  {trip.description && (
                    <p className="text-sm text-muted-foreground mb-2">{trip.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">Setor: {trip.sector}</Badge>
                    <Badge variant="outline">
                      {trip.travelers.length} viajante{trip.travelers.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {trip.travelers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-muted-foreground">Viajantes:</p>
                      <p className="text-sm">{trip.travelers.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma viagem agendada para esta data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}