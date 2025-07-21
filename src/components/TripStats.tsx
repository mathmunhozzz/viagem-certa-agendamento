import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPin, Users, Clock, TrendingUp, Plane } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
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

export function TripStats() {
  const [trips, setTrips] = useState<Trip[]>([]);
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
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayTrips = trips.filter(trip => isToday(parseISO(trip.trip_date)));
  const futureTrips = trips.filter(trip => isFuture(parseISO(trip.trip_date)));
  const pastTrips = trips.filter(trip => isPast(parseISO(trip.trip_date)) && !isToday(parseISO(trip.trip_date)));
  const totalTravelers = trips.reduce((acc, trip) => acc + trip.travelers.length, 0);

  const statsCards = [
    {
      title: 'Viagens Hoje',
      value: todayTrips.length,
      icon: CalendarIcon,
      color: 'bg-gradient-to-br from-travel-primary to-travel-primary-light',
      textColor: 'text-white'
    },
    {
      title: 'Próximas Viagens',
      value: futureTrips.length,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-travel-secondary to-travel-secondary/80',
      textColor: 'text-white'
    },
    {
      title: 'Total de Viajantes',
      value: totalTravelers,
      icon: Users,
      color: 'bg-gradient-to-br from-travel-accent to-travel-accent/80',
      textColor: 'text-white'
    },
    {
      title: 'Viagens Realizadas',
      value: pastTrips.length,
      icon: Plane,
      color: 'bg-gradient-to-br from-travel-success to-travel-success/80',
      textColor: 'text-white'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="travel-card travel-card-dark">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
      {statsCards.map((stat, index) => (
        <Card key={stat.title} className="travel-card travel-card-dark overflow-hidden hover:scale-105 transition-transform duration-300" style={{ animationDelay: `${index * 100}ms` }}>
          <CardContent className="p-0">
            <div className={`${stat.color} p-6 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-white/10 rounded-full"></div>
              <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-white/5 rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
                  <div className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </div>
                </div>
                <p className={`text-sm ${stat.textColor} opacity-90 font-medium`}>
                  {stat.title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}