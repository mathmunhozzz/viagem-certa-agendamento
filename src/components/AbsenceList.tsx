import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Check, X, Clock, MessageSquare, Trash2, User, Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
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
    id: string;
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
  const { employee, loading: employeeLoading } = useCurrentEmployee();
  const { role, loading: roleLoading } = useUserRole();
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

      // Se não for para mostrar todos E não for admin, filtrar por funcionário específico
      if (!showAllAbsences && !isAdmin && employee?.id) {
        query = query.eq('employee_id', employee.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sempre buscar dados dos funcionários quando necessário
      if (data && data.length > 0) {
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
    // Aguardar carregamento do role e employee antes de buscar
    if (roleLoading) return;
    
    // Se não é admin e não tem employee ainda, aguardar
    if (!showAllAbsences && role !== 'admin' && employeeLoading) {
      return;
    }
    
    fetchAbsences();
  }, [refreshTrigger, employee?.id, showAllAbsences, employeeLoading, roleLoading, role]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-fade-in">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovada
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg animate-fade-in">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getDaysInfo = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : start;
    const days = differenceInDays(end, start) + 1;
    return days === 1 ? '1 dia' : `${days} dias`;
  };

  const getEmployeeName = (absence: Absence) => {
    // Sempre priorizar o nome do employee vinculado à ausência
    if (absence.employees?.name) {
      return absence.employees.name;
    }
    
    // Fallback: se não tiver dados do employee mas tiver o employee atual
    if (!showAllAbsences && employee?.name) {
      return employee.name;
    }
    
    // Último recurso
    return 'Funcionário não identificado';
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = format(parseISO(startDate), "dd/MM/yyyy", { locale: ptBR });
    if (endDate) {
      const end = format(parseISO(endDate), "dd/MM/yyyy", { locale: ptBR });
      return `${start} a ${end}`;
    }
    return start;
  };

  // Mostrar loading enquanto carrega role, employee ou ausências
  const isLoadingData = loading || roleLoading || (!showAllAbsences && role !== 'admin' && employeeLoading);
  
  if (isLoadingData) {
    return (
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-muted/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/20 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            {customTitle || (showAllAbsences ? 'Todas as Ausências' : 'Minhas Ausências')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-muted-foreground text-lg font-medium animate-pulse">Carregando ausências...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-muted/50 shadow-xl animate-fade-in">
      {!hideTitle && (
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              {customTitle || (showAllAbsences ? 'Todas as Ausências' : 'Minhas Ausências')}
            </div>
            <Badge variant="secondary" className="text-sm font-semibold bg-primary/20 text-primary border-primary/30">
              {absences.length} {absences.length === 1 ? 'solicitação' : 'solicitações'}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        {absences.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full animate-pulse"></div>
              <CalendarIcon className="h-12 w-12 text-primary mx-auto mt-4" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {showAllAbsences ? 'Nenhuma ausência encontrada' : 'Nenhuma ausência solicitada'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {!showAllAbsences && 'Você pode solicitar ausências usando o formulário acima. Suas solicitações aparecerão aqui.'}
              {showAllAbsences && 'Quando os funcionários solicitarem ausências, elas aparecerão aqui para análise.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {absences.map((absence, index) => (
              <div
                key={absence.id}
                className="group relative overflow-hidden border border-muted/50 rounded-xl p-6 bg-gradient-to-br from-background to-muted/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header com informações principais */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {getEmployeeName(absence)}
                        <Badge variant="outline" className="text-xs">
                          {getDaysInfo(absence.start_date, absence.end_date)}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {formatDateRange(absence.start_date, absence.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(absence.status)}
                    
                    {/* Botões de ação para admin */}
                    {isAdmin && absence.status === 'pending' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="sm"
                          className="h-9 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => openObservationDialog(absence.id, getEmployeeName(absence), 'approved')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 px-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => openObservationDialog(absence.id, getEmployeeName(absence), 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        onClick={() => handleDeleteAbsence(absence.id)}
                        title="Excluir ausência"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Motivo da ausência */}
                <div className="mb-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Motivo da ausência</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {absence.reason}
                  </p>
                </div>

                {/* Observação do admin */}
                {absence.admin_observation && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Observação do Administrador</span>
                    </div>
                    <p className="text-blue-700 leading-relaxed whitespace-pre-wrap">
                      {absence.admin_observation}
                    </p>
                  </div>
                )}

                {/* Footer com data de criação */}
                <div className="flex items-center justify-between pt-3 border-t border-muted/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Solicitado em {format(parseISO(absence.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  
                  {absence.status !== 'pending' && (
                    <div className="text-xs text-muted-foreground">
                      {absence.status === 'approved' ? 'Aprovada' : 'Rejeitada'} pelo administrador
                    </div>
                  )}
                </div>
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