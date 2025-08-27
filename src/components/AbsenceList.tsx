import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Check, X, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useUserRole } from '@/hooks/useUserRole';
import { AbsenceObservationDialog } from './AbsenceObservationDialog';

interface Absence {
  id: string;
  start_date: string;
  end_date?: string;
  reason: string;
  status: string;
  created_at: string;
  employee_id: string;
  admin_observation?: string;
  employees?: {
    name: string;
  } | null;
}

interface AbsenceListProps {
  refreshTrigger: number;
  showAllAbsences?: boolean;
  onStatusUpdated?: () => void;
  hideTitle?: boolean;
  customTitle?: string;
}

export function AbsenceList({ 
  refreshTrigger, 
  showAllAbsences = false, 
  onStatusUpdated,
  hideTitle = false,
  customTitle
}: AbsenceListProps) {
  const { toast } = useToast();
  const { employee } = useCurrentEmployee();
  const { role } = useUserRole();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [observationDialog, setObservationDialog] = useState<{
    isOpen: boolean;
    absenceId: string;
    employeeName: string;
    action: 'approved' | 'rejected';
  }>({
    isOpen: false,
    absenceId: '',
    employeeName: '',
    action: 'approved'
  });

  const isAdmin = role === 'admin';
  const canViewAll = showAllAbsences && isAdmin;

  const fetchAbsences = async () => {
    try {
      let query = supabase
        .from('employee_absences')
        .select('*')
        .order('created_at', { ascending: false });

      // Se não for para mostrar todos (showAllAbsences=false), filtrar por funcionário
      if (!showAllAbsences && employee?.id) {
        query = query.eq('employee_id', employee.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Se for para mostrar todas as ausências, buscar dados dos funcionários
      if (showAllAbsences && data) {
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

  const openObservationDialog = (absenceId: string, employeeName: string, action: 'approved' | 'rejected') => {
    setObservationDialog({
      isOpen: true,
      absenceId,
      employeeName,
      action
    });
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ausência? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_absences')
        .delete()
        .eq('id', absenceId);

      if (error) throw error;

      toast({
        title: 'Ausência excluída',
        description: 'A ausência foi excluída com sucesso.',
      });

      fetchAbsences();
      onStatusUpdated?.();
    } catch (error: any) {
      console.error('Erro ao excluir ausência:', error);
      toast({
        title: 'Erro ao excluir ausência',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [refreshTrigger, employee?.id, showAllAbsences]);

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
            {customTitle || (showAllAbsences ? 'Todas as Ausências' : 'Minhas Ausências')}
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
      {!hideTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {customTitle || (showAllAbsences ? 'Todas as Ausências' : 'Minhas Ausências')} ({absences.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {absences.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {showAllAbsences ? 'Nenhuma ausência encontrada' : 'Você ainda não solicitou nenhuma ausência'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!showAllAbsences && 'Você pode solicitar ausências usando o formulário acima'}
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
                    {showAllAbsences && absence.employees && (
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
                          onClick={() => openObservationDialog(absence.id, absence.employees?.name || 'Funcionário', 'approved')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => openObservationDialog(absence.id, absence.employees?.name || 'Funcionário', 'rejected')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteAbsence(absence.id)}
                        title="Excluir ausência"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
                  <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap">
                    {absence.reason}
                  </p>
                </div>

                {absence.admin_observation && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Observação do Administrador</span>
                    </div>
                    <p className="text-sm text-blue-700 break-words leading-relaxed whitespace-pre-wrap">
                      {absence.admin_observation}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Solicitado em {format(parseISO(absence.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>  
            ))}
          </div>
        )}
      </CardContent>

      <AbsenceObservationDialog
        isOpen={observationDialog.isOpen}
        onOpenChange={(open) => setObservationDialog(prev => ({ ...prev, isOpen: open }))}
        absenceId={observationDialog.absenceId}
        employeeName={observationDialog.employeeName}
        action={observationDialog.action}
        onSuccess={(() => {
          fetchAbsences();
          onStatusUpdated?.();
        })}
      />
    </Card>
  );
}