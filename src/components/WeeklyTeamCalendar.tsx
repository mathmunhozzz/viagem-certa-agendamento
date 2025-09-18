import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Trip {
  id: string;
  title: string;
  trip_date: string;
  departure_time?: string;
  sector: string;
  employee_ids: string[];
  status: string;
  travelers: string[];
  vehicles?: {
    brand: string;
    model: string;
    plate: string;
  };
  employees?: Array<{
    id: string;
    name: string;
  }>;
}

export default function WeeklyTeamCalendar() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchWeeklyTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicles:vehicle_id (
            brand,
            model,
            plate
          )
        `)
        .gte('trip_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('trip_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('trip_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (error) {
        console.error('Erro ao buscar viagens:', error);
        return;
      }

      if (data) {
        // Buscar nomes dos funcionários
        const allEmployeeIds = Array.from(
          new Set(data.flatMap(trip => trip.employee_ids || []))
        );

        const { data: employeesData } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', allEmployeeIds);

        const employeesMap = new Map(
          employeesData?.map(emp => [emp.id, emp]) || []
        );

        const tripsWithEmployees = data.map(trip => ({
          ...trip,
          employees: (trip.employee_ids || []).map(id => employeesMap.get(id)).filter(Boolean)
        }));

        setTrips(tripsWithEmployees);
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyTrips();
  }, [currentWeek]);

  const getTripsForDate = (date: Date) => {
    return trips.filter(trip => isSameDay(new Date(trip.trip_date), date));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agenda da Equipe
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[200px] text-center">
                {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayTrips = getTripsForDate(day);
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <div className="text-center">
                      <h3 className="font-semibold text-sm">
                        {format(day, 'EEEE', { locale: ptBR })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(day, 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                    
                    <div className="space-y-2 min-h-[100px]">
                      {dayTrips.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          Sem viagens
                        </div>
                      ) : (
                        dayTrips.map((trip) => (
                          <Card key={trip.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {trip.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(trip.status)}`}
                                >
                                  {trip.status === 'scheduled' && 'Agendada'}
                                  {trip.status === 'in_progress' && 'Em andamento'}
                                  {trip.status === 'completed' && 'Concluída'}
                                  {trip.status === 'cancelled' && 'Cancelada'}
                                </Badge>
                              </div>
                              
                              {trip.departure_time && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {trip.departure_time}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">{trip.sector}</span>
                              </div>
                              
                              {trip.employees && trip.employees.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Funcionários:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {trip.employees.map((employee, index) => (
                                      <Badge 
                                        key={employee.id} 
                                        variant="secondary" 
                                        className="text-xs px-2 py-0.5"
                                      >
                                        {employee.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {trip.travelers && trip.travelers.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {trip.travelers.length} passageiro{trip.travelers.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}