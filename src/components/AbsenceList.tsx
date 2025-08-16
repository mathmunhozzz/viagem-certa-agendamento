import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Check, X, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useUserRole } from '@/hooks/useUserRole';

interface Absence {
  id: string;
  start_date: string;
  end_date?: string;
  reason: string;
  status: string;
  created_at: string;
  employee_id: string;
  employees?: {
    name: string;
  } | null;
}

interface AbsenceListProps {
  refreshTrigger: number;
  showAllAbsences?: boolean;
}

export function AbsenceList({ refreshTrigger, showAllAbsences = false }: AbsenceListProps) {
  const { toast } = useToast();
  const { employee } = useCurrentEmployee();
  const { role } = useUserRole();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const canViewAll = showAllAbsences && isAdmin;

  const fetchAbsences = async () => {
    try {
      let query = supabase
        .from('employee_absences')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por funcionário se não for admin ou não for para mostrar todos
      if (!canViewAll && employee?.id) {
        query = query.eq('employee_id', employee.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Se for para mostrar todas as ausências, buscar dados dos funcionários
      if (canViewAll && data) {
        const employeeIds = [...new Set(data.map(absence => absence.employee_id))];
        const { data: employees } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', employeeIds);

        const employeeMap = employees?.reduce((acc, emp) => {
          acc[emp.id] = emp;
          return acc;
        }, {} as Record<string, any>) || {};

        const absencesWithEmployees = data.map(absence => ({
          ...absence,
          employees: employeeMap[absence.employee_id] || null
        }));

        setAbsences(absencesWithEmployees);
      } else {
        setAbsences(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar ausências:', error);
      toast({
        title: 'Erro ao carregar ausências',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAbsenceStatus = async (absenceId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('employee_absences')
        .update({ status })
        .eq('id', absenceId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Ausência ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });

      fetchAbsences();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da ausência.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [refreshTrigger, employee?.id, canViewAll]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Aprovada
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <X className="h-3 w-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = format(parseISO(startDate), "dd/MM/yyyy", { locale: ptBR });
    if (endDate) {
      const end = format(parseISO(endDate), "dd/MM/yyyy", { locale: ptBR });
      return `${start} a ${end}`;
    }
    return start;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {canViewAll ? 'Todas as Ausências' : 'Minhas Ausências'} 
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando ausências...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {canViewAll ? 'Todas as Ausências' : 'Minhas Ausências'} ({absences.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {absences.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {canViewAll ? 'Nenhuma ausência encontrada' : 'Você ainda não solicitou nenhuma ausência'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!canViewAll && 'Você pode solicitar ausências usando o formulário acima'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {absences.map((absence) => (
              <div
                key={absence.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-background to-muted/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    {canViewAll && absence.employees && (
                      <h4 className="font-semibold text-foreground">
                        {absence.employees.name}
                      </h4>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDateRange(absence.start_date, absence.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(absence.status)}
                    {isAdmin && absence.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateAbsenceStatus(absence.id, 'approved')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateAbsenceStatus(absence.id, 'rejected')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
                  <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap">
                    {absence.reason}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Solicitado em {format(parseISO(absence.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>  
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}