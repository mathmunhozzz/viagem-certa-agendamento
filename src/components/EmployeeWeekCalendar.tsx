import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp, FileText, Paperclip, Loader2, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TripAttachmentsDialog } from "@/components/TripAttachmentsDialog";
import { TripReport } from "./TripReport";
import { TripNarrativeDialog } from "./TripNarrativeDialog";
interface Trip {
  id: string;
  title: string;
  description?: string;
  observations?: string;
  trip_date: string;
  departure_time?: string;
  sector: string;
  status: string;
  travelers?: string[];
  clients?: {
    name: string;
    municipality?: string;
  };
}

export function EmployeeWeekCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [attachmentsTripId, setAttachmentsTripId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
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
    queryKey: ["employee-week-trips", employee?.id, currentWeekStart.toISOString()],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const startDate = currentWeekStart;
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

  const today = new Date();
  const startDate = currentWeekStart;
  const endDate = addDays(startDate, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const openNarrative = async (trip: Trip) => {
    if (!employee?.id) {
      toast({ title: "Funcionário não vinculado", description: "Vincule seu usuário a um funcionário para relatar a viagem.", variant: "destructive" });
      return;
    }
    setNarrativeLoading((prev) => ({ ...prev, [trip.id]: true }));
    try {
      const { data, error } = await (supabase as any)
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
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
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
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Semana Anterior
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold">
              {format(startDate, "dd", { locale: ptBR })} a {format(weekDays[6], "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">Calendário de 7 dias</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-2"
          >
            Próxima Semana
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {weekDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTrips = tripsByDate[dateKey] || [];
          
          return (
            <Card 
              key={index} 
              className={`${isToday(day) ? 'border-primary border-2 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' : 'border-border hover:shadow-sm'} min-h-[280px] w-full transition-all duration-200`}
            >
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm text-center">
                  <div className={`font-bold text-xs ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, "dd", { locale: ptBR })}
                  </div>
                  {isToday(day) && (
                    <Badge variant="default" className="text-xs mt-1">HOJE</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                {dayTrips.length > 0 ? (
                  <div className="space-y-2">
                    {dayTrips.map((trip) => (
                      <div key={trip.id} className="w-full">
                        <div 
                          className={`p-3 rounded-lg border text-sm transition-all hover:shadow-sm w-full ${getStatusColor(trip.status)}`}
                          onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="font-medium text-break flex-1 min-w-0 pr-2">{trip.title}</div>
                            {(trip.description || trip.observations) && (
                              <div className="ml-1 flex-shrink-0">
                                {expandedTrip === trip.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            )}
                          </div>
                          {trip.departure_time && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span className="text-break">{trip.departure_time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-break min-w-0">{trip.sector}</span>
                          </div>
                          {trip.clients && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="text-break min-w-0">{trip.clients.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {expandedTrip === trip.id && (trip.description || trip.observations) && (
                          <div className="mt-2 p-3 bg-card border rounded-lg text-sm space-y-2 w-full">
                            {trip.description && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm">Descrição:</span>
                                </div>
                                <div className="bg-muted/30 border border-muted rounded p-2 w-full">
                                  <p className="text-sm text-foreground break-words hyphens-auto leading-relaxed whitespace-pre-wrap word-break overflow-wrap-anywhere">{trip.description}</p>
                                </div>
                              </div>
                            )}
                            {trip.observations && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-medium text-primary">
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm">Observações:</span>
                                </div>
                                <div className="bg-primary/5 border border-primary/20 rounded p-2 w-full">
                                  <p className="text-sm text-primary break-words hyphens-auto leading-relaxed whitespace-pre-wrap word-break overflow-wrap-anywhere">{trip.observations}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 pt-2 border-t space-y-2">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => setAttachmentsTripId(trip.id)}>
                              <FileText className="mr-1 h-3 w-3" />
                              Anexos
                            </Button>
                            <input
                              id={`file-${trip.id}`}
                              type="file"
                              accept="image/*,application/pdf"
                              multiple
                              className="hidden"
                              onChange={(e) => handleUpload(trip.id, e.target.files)}
                            />
                            <Button size="sm" onClick={() => document.getElementById(`file-${trip.id}`)?.click()} disabled={!!uploading[trip.id]}>
                              {uploading[trip.id] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Paperclip className="mr-1 h-3 w-3" />}
                              Anexar
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="secondary" onClick={() => openNarrative(trip)} disabled={!!narrativeLoading[trip.id]}>
                              {narrativeLoading[trip.id] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileText className="mr-1 h-3 w-3" />}
                              Relatar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setReportTrip(trip)}>
                              <Printer className="mr-1 h-3 w-3" />
                              Imprimir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs">Sem viagens</span>
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
      <TripAttachmentsDialog
        tripId={attachmentsTripId}
        open={!!attachmentsTripId}
        onClose={() => setAttachmentsTripId(null)}
      />
      
      {reportTrip && (
        <TripReport
          trip={{
            ...reportTrip,
            travelers: reportTrip.travelers || [],
            description: reportTrip.description || "",
            departure_time: reportTrip.departure_time || "",
          } as any}
          onClose={() => setReportTrip(null)}
        />
      )}

      <TripNarrativeDialog
        open={!!narrativeDialogTripId}
        onOpenChange={(open) => !open && setNarrativeDialogTripId(null)}
        tripId={narrativeDialogTripId || ''}
        employeeId={employee?.id}
        initialContent={narrativeInitialContent}
        onSaved={(content) => {
          toast({ title: "Relato salvo", description: "Seu relato da viagem foi salvo com sucesso." });
          setNarrativeInitialContent(content);
        }}
      />
    </div>
  );
}