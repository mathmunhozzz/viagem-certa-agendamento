import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Trip {
  id: string;
  title: string;
  description?: string;
  trip_date: string;
  departure_time?: string;
  sector: string;
  status: string;
  travelers: string[];
  employee_ids?: string[];
  client_id?: string;
  clients?: {
    name: string;
    municipality?: string;
  };
}

export function EmployeeTripView() {
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
    queryKey: ["employee-trips", employee?.id],
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "Agendada", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "secondary" as const },
      completed: { label: "Concluída", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "default" as const,
    };

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Filtrar viagens da semana atual
  const now = new Date();
  const today = new Date(now.toDateString());
  
  const todayTrips = trips.filter(trip => 
    new Date(trip.trip_date).toDateString() === today.toDateString()
  );

  const upcomingThisWeek = trips.filter(trip => 
    new Date(trip.trip_date) > today
  );

  const pastThisWeek = trips.filter(trip => 
    new Date(trip.trip_date) < today
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Olá, {employee.name}!</h2>
        <p className="text-muted-foreground">Suas viagens desta semana</p>
      </div>

      {todayTrips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            🚗 Viagens de Hoje ({todayTrips.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTrips.map((trip) => (
              <Card key={trip.id} className="border-l-4 border-l-green-500 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{trip.title}</CardTitle>
                    {getStatusBadge(trip.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {trip.departure_time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{trip.departure_time}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.sector}</span>
                  </div>

                  {trip.clients && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {trip.clients.name}
                        {trip.clients.municipality && ` - ${trip.clients.municipality}`}
                      </span>
                    </div>
                  )}

                  {trip.description && (
                    <p className="text-sm text-muted-foreground">{trip.description}</p>
                  )}

                  {trip.travelers.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Passageiros: </span>
                      <span className="text-muted-foreground">
                        {trip.travelers.join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcomingThisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            📅 Próximas desta Semana ({upcomingThisWeek.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingThisWeek.map((trip) => (
              <Card key={trip.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{trip.title}</CardTitle>
                    {getStatusBadge(trip.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {trip.departure_time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{trip.departure_time}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.sector}</span>
                  </div>

                  {trip.clients && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {trip.clients.name}
                        {trip.clients.municipality && ` - ${trip.clients.municipality}`}
                      </span>
                    </div>
                  )}

                  {trip.description && (
                    <p className="text-sm text-muted-foreground">{trip.description}</p>
                  )}

                  {trip.travelers.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Passageiros: </span>
                      <span className="text-muted-foreground">
                        {trip.travelers.join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastThisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            ✅ Anteriores desta Semana ({pastThisWeek.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastThisWeek.map((trip) => (
              <Card key={trip.id} className="border-l-4 border-l-gray-300 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{trip.title}</CardTitle>
                    {getStatusBadge(trip.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {trip.departure_time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{trip.departure_time}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.sector}</span>
                  </div>

                  {trip.clients && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {trip.clients.name}
                        {trip.clients.municipality && ` - ${trip.clients.municipality}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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