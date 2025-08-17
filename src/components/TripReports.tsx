import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, FileText, Users, Car, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AbsenceReports } from '@/components/AbsenceReports';

interface Trip {
  id: string;
  title: string;
  description: string;
  trip_date: string;
  departure_time: string;
  sector: string;
  travelers: string[];
  employee_ids: string[];
  vehicle?: {
    brand: string;
    model: string;
    plate: string;
  };
  credit_card?: {
    name: string;
    brand: string;
    last_four_digits: string;
  };
  employees?: {
    name: string;
  }[];
}

interface Sector {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
}

interface Employee {
  id: string;
  name: string;
}

export function TripReports() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    reportType: 'all',
    startDate: '',
    endDate: '',
    sectorId: 'all',
    vehicleId: 'all',
    employeeId: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectorsRes, vehiclesRes, employeesRes] = await Promise.all([
        supabase.from('sectors').select('id, name').order('name'),
        supabase.from('vehicles').select('id, brand, model, plate').order('brand'),
        supabase.from('employees').select('id, name').order('name')
      ]);

      if (sectorsRes.data) setSectors(sectorsRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(brand, model, plate),
          credit_card:credit_cards(name, brand, last_four_digits)
        `)
        .order('trip_date', { ascending: false });

      // Filtros de data
      if (filters.startDate) {
        query = query.gte('trip_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('trip_date', filters.endDate);
      }

      // Filtros específicos
      if (filters.sectorId && filters.sectorId !== 'all') {
        query = query.eq('sector_id', filters.sectorId);
      }
      if (filters.vehicleId && filters.vehicleId !== 'all') {
        query = query.eq('vehicle_id', filters.vehicleId);
      }
      if (filters.employeeId && filters.employeeId !== 'all') {
        query = query.contains('employee_ids', [filters.employeeId]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Implementação básica de export
    const printContent = document.getElementById('trip-report-table');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Relatório de Viagens</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Viagens</h1>
              <p>Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Fim'}</p>
            </div>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow?.print();
    }
  };

  const getReportTitle = () => {
    switch (filters.reportType) {
      case 'sector':
        return 'Relatório por Setor';
      case 'vehicle':
        return 'Relatório por Veículo';
      case 'employee':
        return 'Relatório por Funcionário';
      default:
        return 'Relatório Geral de Viagens';
    }
  };

  const getReportIcon = () => {
    switch (filters.reportType) {
      case 'sector':
        return <Building className="h-5 w-5 text-travel-primary" />;
      case 'vehicle':
        return <Car className="h-5 w-5 text-travel-primary" />;
      case 'employee':
        return <Users className="h-5 w-5 text-travel-primary" />;
      default:
        return <FileText className="h-5 w-5 text-travel-primary" />;
    }
  };

  return (
    <Tabs defaultValue="trips" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="trips">Relatório de Viagens</TabsTrigger>
        <TabsTrigger value="absences">Relatório de Ausências</TabsTrigger>
      </TabsList>
      
      <TabsContent value="trips">
        <div className="space-y-6">
          <Card className="travel-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getReportIcon()}
                {getReportTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Tipo de Relatório</Label>
                  <Select 
                    value={filters.reportType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Relatório Geral</SelectItem>
                      <SelectItem value="sector">Por Setor</SelectItem>
                      <SelectItem value="vehicle">Por Veículo</SelectItem>
                      <SelectItem value="employee">Por Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                {(filters.reportType === 'all' || filters.reportType === 'sector') && (
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Select 
                      value={filters.sectorId} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sectorId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os setores</SelectItem>
                        {sectors.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(filters.reportType === 'all' || filters.reportType === 'vehicle') && (
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Veículo</Label>
                    <Select 
                      value={filters.vehicleId} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, vehicleId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os veículos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} - {vehicle.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(filters.reportType === 'all' || filters.reportType === 'employee') && (
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
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchTrips} disabled={loading} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {loading ? 'Carregando...' : 'Gerar Relatório'}
                </Button>
                {trips.length > 0 && (
                  <Button variant="outline" onClick={exportToPDF} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {trips.length > 0 && (
            <Card className="travel-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resultados ({trips.length} viagens)</span>
                  <Badge variant="outline">{getReportTitle()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div id="trip-report-table" className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Cartão de Crédito</TableHead>
                        <TableHead>Funcionários</TableHead>
                        <TableHead>Viajantes Adicionais</TableHead>
                        <TableHead>Horário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            {format(parseISO(trip.trip_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{trip.title}</TableCell>
                          <TableCell>{trip.sector}</TableCell>
                          <TableCell>
                            {trip.vehicle ? (
                              <div className="text-sm">
                                <div>{trip.vehicle.brand} {trip.vehicle.model}</div>
                                <div className="text-muted-foreground">{trip.vehicle.plate}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.credit_card ? (
                              <div className="text-sm">
                                <div>{trip.credit_card.name}</div>
                                <div className="text-muted-foreground">
                                  {trip.credit_card.brand} •••• {trip.credit_card.last_four_digits}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.employee_ids && trip.employee_ids.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trip.employee_ids.map((empId, idx) => {
                                  const employee = employees.find(e => e.id === empId);
                                  return employee ? (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {employee.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.travelers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trip.travelers.slice(0, 2).map((traveler, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {traveler}
                                  </Badge>
                                ))}
                                {trip.travelers.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{trip.travelers.length - 2} mais
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.departure_time ? (
                              format(parseISO(`2000-01-01T${trip.departure_time}`), 'HH:mm')
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && trips.length === 0 && filters.startDate && (
            <Card className="travel-card">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma viagem encontrada</h3>
                <p className="text-muted-foreground">
                  Não foram encontradas viagens para os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="absences">
        <AbsenceReports />
      </TabsContent>
    </Tabs>
  );
}