import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Trip {
  id: string;
  title: string;
  description?: string;
  trip_date: string;
  departure_time?: string;
  sector: string;
  status: string;
  clients?: {
    name: string;
    municipality?: string;
  };
}

export function EmployeeWeekCalendar() {
  const { user } = useAuth();

  const { data: employee } = useQuery({
    queryKey: ["employee-by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["employee-week-trips", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      // Pegar início e fim da semana atual
      const now = new Date();
      const startWeek = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
      const endWeek = endOfWeek(now, { weekStartsOn: 1 }); // Domingo
      
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients (
            name,
            municipality
          )
        `)
        .contains("employee_ids", [employee.id])
        .gte("trip_date", startWeek.toISOString().split('T')[0])
        .lte("trip_date", endWeek.toISOString().split('T')[0])
        .order("trip_date", { ascending: true });
      
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!employee?.id,
  });

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Você precisa estar logado para ver suas viagens.</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Sua conta não está vinculada a nenhum funcionário. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-4">Carregando suas viagens...</div>;
  }

  const now = new Date();
  const startWeek = startOfWeek(now, { weekStartsOn: 1 });
  
  // Criar array dos 7 dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
  
  // Agrupar viagens por data
  const tripsByDate = trips.reduce((acc, trip) => {
    // Tratar a data sem problemas de timezone
    const tripDate = new Date(trip.trip_date + 'T12:00:00.000Z');
    const dateKey = format(tripDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Olá, {employee.name}!</h2>
        <p className="text-muted-foreground">Calendário Semanal - {format(startWeek, "dd", { locale: ptBR })} a {format(weekDays[6], "dd 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTrips = tripsByDate[dateKey] || [];
          
          return (
            <Card 
              key={index} 
              className={`${isToday(day) ? 'border-green-500 border-2 bg-green-50' : 'border-gray-200'} min-h-[200px]`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  <div className={`font-bold ${isToday(day) ? 'text-green-700' : ''}`}>
                    {format(day, "EEEE", { locale: ptBR })}
                  </div>
                  <div className={`text-lg ${isToday(day) ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {format(day, "dd", { locale: ptBR })}
                  </div>
                  {isToday(day) && (
                    <Badge className="bg-green-600 text-white text-xs mt-1">HOJE</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {dayTrips.length > 0 ? (
                  <div className="space-y-2">
                    {dayTrips.map((trip) => (
                      <div 
                        key={trip.id} 
                        className={`p-2 rounded-lg border text-xs ${getStatusColor(trip.status)}`}
                      >
                        <div className="font-medium truncate">{trip.title}</div>
                        {trip.departure_time && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{trip.departure_time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{trip.sector}</span>
                        </div>
                        {trip.clients && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            <span className="truncate">{trip.clients.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground mt-4">
                    Sem viagens
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">Nenhuma viagem desta semana</p>
          <p className="text-sm text-muted-foreground mt-2">
            Você não tem viagens programadas para esta semana.
          </p>
        </div>
      )}
    </div>
  );
}