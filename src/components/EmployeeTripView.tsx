import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Paperclip, Loader2, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TripReport } from "./TripReport";
import { TripNarrativeDialog } from "./TripNarrativeDialog";
import { format, addDays } from "date-fns";
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
  const { toast } = useToast();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [reportTrip, setReportTrip] = useState<Trip | null>(null);
  const [narrativeDialogTripId, setNarrativeDialogTripId] = useState<string | null>(null);
  const [narrativeInitialContent, setNarrativeInitialContent] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState<Record<string, boolean>>({});

  const handleUpload = async (tripId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user || !employee) {
      toast({ title: "Sessão inválida", description: "Faça login novamente.", variant: "destructive" });
      return;
    }
    setUploading((prev) => ({ ...prev, [tripId]: true }));
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/\s+/g, "_");
        const path = `${user.id}/${tripId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("trip-attachments").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from("trip_attachments").insert({
          trip_id: tripId,
          employee_id: employee.id,
          file_name: file.name,
          file_path: path,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          uploaded_by: user.id,
        });
        if (insertError) throw insertError;
      }
      toast({ title: "Anexo enviado", description: "Seus arquivos foram anexados à viagem." });
    } catch (err: any) {
      toast({ title: "Erro ao anexar", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading((prev) => ({ ...prev, [tripId]: false }));
      const input = document.getElementById(`file-${tripId}`) as HTMLInputElement | null;
      if (input) input.value = "";
    }
  };

  const { data: employee } = useQuery({
    queryKey: ["employee-by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["employee-trips", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      // Pegar 7 dias a partir de hoje
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = addDays(startDate, 6);
      
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
        .gte("trip_date", startDate.toISOString().split('T')[0])
        .lte("trip_date", endDate.toISOString().split('T')[0])
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

  // Filtrar viagens da semana atual - usando UTC para evitar problemas de timezone
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayTrips = trips.filter(trip => {
    const tripDate = new Date(trip.trip_date + 'T00:00:00.000Z');
    const tripLocalDate = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
    return tripLocalDate.getTime() === today.getTime();
  });

  const upcomingThisWeek = trips.filter(trip => {
    const tripDate = new Date(trip.trip_date + 'T00:00:00.000Z');
    const tripLocalDate = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
    return tripLocalDate.getTime() > today.getTime();
  });

  const pastThisWeek = trips.filter(trip => {
    const tripDate = new Date(trip.trip_date + 'T00:00:00.000Z');
    const tripLocalDate = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
    return tripLocalDate.getTime() < today.getTime();
  });

  const openNarrative = async (trip: Trip) => {
    if (!employee?.id) {
      toast({ title: "Funcionário não vinculado", description: "Vincule seu usuário a um funcionário para relatar a viagem.", variant: "destructive" });
      return;
    }
    setNarrativeLoading((prev) => ({ ...prev, [trip.id]: true }));
    try {
      const { data, error } = await supabase
        .from('trip_reports')
        .select('content')
        .eq('trip_id', trip.id)
        .eq('employee_id', employee.id);
      if (error) {
        setNarrativeInitialContent('');
      } else {
        const rows = (data as Array<{ content: string }> | null) ?? null;
        setNarrativeInitialContent(rows?.[0]?.content ?? '');
      }
      setNarrativeDialogTripId(trip.id);
    } finally {
      setNarrativeLoading((prev) => ({ ...prev, [trip.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Olá, {employee.name}!</h2>
        <p className="text-muted-foreground">Suas viagens dos próximos 7 dias</p>
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
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Envie notas e comprovantes (imagens ou PDF)</span>
                    <div className="flex items-center gap-2">
                      <input
                        id={`file-${trip.id}`}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(trip.id, e.target.files)}
                      />
                      <Button size="sm" onClick={() => document.getElementById(`file-${trip.id}`)?.click()} disabled={!!uploading[trip.id]}>
                        {uploading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
                        Anexar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openNarrative(trip)} disabled={!!narrativeLoading[trip.id]}>
                        {narrativeLoading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Relatar viagem
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReportTrip(trip)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir relatório
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcomingThisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            📅 Próximas dos próximos 7 dias ({upcomingThisWeek.length})
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
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Envie notas e comprovantes (imagens ou PDF)</span>
                    <div className="flex items-center gap-2">
                      <input
                        id={`file-${trip.id}`}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(trip.id, e.target.files)}
                      />
                      <Button size="sm" onClick={() => document.getElementById(`file-${trip.id}`)?.click()} disabled={!!uploading[trip.id]}>
                        {uploading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
                        Anexar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openNarrative(trip)} disabled={!!narrativeLoading[trip.id]}>
                        {narrativeLoading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Relatar viagem
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReportTrip(trip)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir relatório
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastThisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            ✅ Anteriores dos últimos 7 dias ({pastThisWeek.length})
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
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Envie notas e comprovantes (imagens ou PDF)</span>
                    <div className="flex items-center gap-2">
                      <input
                        id={`file-${trip.id}`}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(trip.id, e.target.files)}
                      />
                      <Button size="sm" onClick={() => document.getElementById(`file-${trip.id}`)?.click()} disabled={!!uploading[trip.id]}>
                        {uploading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
                        Anexar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openNarrative(trip)} disabled={!!narrativeLoading[trip.id]}>
                        {narrativeLoading[trip.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Relatar viagem
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReportTrip(trip)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir relatório
                      </Button>
                    </div>
                  </div>
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
      {/* Dialog de Relato */}
      <TripNarrativeDialog
        open={!!narrativeDialogTripId}
        onOpenChange={(open) => {
          if (!open) setNarrativeDialogTripId(null);
        }}
        tripId={narrativeDialogTripId || ""}
        employeeId={employee?.id}
        initialContent={narrativeInitialContent ?? ""}
      />

      {/* Overlay de Impressão */}
      {reportTrip && (
        <TripReport
          trip={{
            ...reportTrip,
            description: reportTrip.description ?? "",
            departure_time: reportTrip.departure_time ?? "",
          } as any}
          onClose={() => setReportTrip(null)}
        />
      )}
    </div>
  );
}