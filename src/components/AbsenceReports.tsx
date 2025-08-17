import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, UserCheck, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AbsenceReport {
  employee_id: string;
  employee_name: string;
  total_absences: number;
  approved_absences: number;
  rejected_absences: number;
  pending_absences: number;
  absence_details: {
    id: string;
    start_date: string;
    end_date?: string;
    reason: string;
    status: string;
    created_at: string;
    admin_observation?: string;
  }[];
}

interface Employee {
  id: string;
  name: string;
}

export function AbsenceReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<AbsenceReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employeeId: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const fetchAbsenceReports = async () => {
    setLoading(true);
    try {
      // Primeiro, buscamos as ausências
      let absencesQuery = supabase
        .from('employee_absences')
        .select('*');

      // Filtros de data
      if (filters.startDate) {
        absencesQuery = absencesQuery.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        absencesQuery = absencesQuery.lte('start_date', filters.endDate);
      }

      // Filtro por funcionário
      if (filters.employeeId && filters.employeeId !== 'all') {
        absencesQuery = absencesQuery.eq('employee_id', filters.employeeId);
      }

      // Filtro por status
      if (filters.status && filters.status !== 'all') {
        absencesQuery = absencesQuery.eq('status', filters.status);
      }

      const { data: absencesData, error: absencesError } = await absencesQuery.order('created_at', { ascending: false });
      
      if (absencesError) throw absencesError;

      if (!absencesData || absencesData.length === 0) {
        setReports([]);
        return;
      }

      // Buscar os dados dos funcionários para os IDs encontrados
      const employeeIds = [...new Set(absencesData.map(absence => absence.employee_id))];
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);

      if (employeesError) throw employeesError;

      // Criar um mapa de funcionários para lookup rápido
      const employeeMap = (employeesData || []).reduce((acc, emp) => {
        acc[emp.id] = emp.name;
        return acc;
      }, {} as Record<string, string>);

      // Agrupar dados por funcionário
      const reportMap = new Map<string, AbsenceReport>();
      
      absencesData.forEach((absence: any) => {
        const empId = absence.employee_id;
        const empName = employeeMap[empId] || 'Funcionário Desconhecido';

        if (!reportMap.has(empId)) {
          reportMap.set(empId, {
            employee_id: empId,
            employee_name: empName,
            total_absences: 0,
            approved_absences: 0,
            rejected_absences: 0,
            pending_absences: 0,
            absence_details: []
          });
        }

        const report = reportMap.get(empId)!;
        report.total_absences++;
        
        switch (absence.status) {
          case 'approved':
            report.approved_absences++;
            break;
          case 'rejected':
            report.rejected_absences++;
            break;
          case 'pending':
            report.pending_absences++;
            break;
        }

        report.absence_details.push({
          id: absence.id,
          start_date: absence.start_date,
          end_date: absence.end_date,
          reason: absence.reason,
          status: absence.status,
          created_at: absence.created_at,
          admin_observation: absence.admin_observation
        });
      });

      setReports(Array.from(reportMap.values()));
    } catch (error: any) {
      console.error('Erro ao buscar relatório de ausências:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: error?.message || "Não foi possível carregar os dados do relatório.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const printContent = document.getElementById('absence-report-table');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Relatório de Ausências</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .status-approved { color: green; }
              .status-rejected { color: red; }
              .status-pending { color: orange; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Ausências por Profissional</h1>
              <p>Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Fim'}</p>
            </div>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow?.print();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-travel-primary" />
            Relatório de Ausências por Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select 
                value={filters.employeeId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchAbsenceReports} disabled={loading} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {loading ? 'Carregando...' : 'Gerar Relatório'}
            </Button>
            {reports.length > 0 && (
              <Button variant="outline" onClick={exportToPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Relatório de Ausências ({reports.length} funcionários)</span>
              <Badge variant="outline">
                Total: {reports.reduce((acc, r) => acc + r.total_absences, 0)} ausências
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="absence-report-table" className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Aprovadas</TableHead>
                    <TableHead className="text-center">Rejeitadas</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead>Detalhes das Ausências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.employee_id}>
                      <TableCell className="font-medium">{report.employee_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{report.total_absences}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">
                          {report.approved_absences}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 text-red-800">
                          {report.rejected_absences}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {report.pending_absences}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2 max-w-md">
                          {report.absence_details.slice(0, 3).map((absence) => (
                            <div key={absence.id} className="text-sm border rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {formatDateRange(absence.start_date, absence.end_date)}
                                </span>
                                {getStatusBadge(absence.status)}
                              </div>
                              <p className="text-muted-foreground text-xs truncate">
                                {absence.reason}
                              </p>
                              {absence.admin_observation && (
                                <p className="text-blue-600 text-xs mt-1">
                                  Admin: {absence.admin_observation}
                                </p>
                              )}
                            </div>
                          ))}
                          {report.absence_details.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{report.absence_details.length - 3} mais ausências
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && reports.length === 0 && (filters.startDate || filters.endDate || filters.employeeId !== 'all' || filters.status !== 'all') && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma ausência encontrada</h3>
            <p className="text-muted-foreground">
              Não foram encontradas ausências para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}