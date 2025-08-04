import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays, Car, Users, TrendingUp, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { EmailTestCenter } from './EmailTestCenter';

interface TripStatistics {
  month: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
}

interface SectorStatistics {
  sector_name: string;
  trip_count: number;
  employee_count: number;
  avg_travelers: number;
}

interface VehicleStatistics {
  vehicle_name: string;
  plate: string;
  capacity: number;
  trip_count: number;
  usage_percentage: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function TripDashboard() {
  const [tripStats, setTripStats] = useState<TripStatistics[]>([]);
  const [sectorStats, setSectorStats] = useState<SectorStatistics[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar estatísticas de viagens por mês
      const { data: tripData } = await supabase
        .from('trip_statistics')
        .select('*')
        .order('month');

      // Buscar estatísticas por setor
      const { data: sectorData } = await supabase
        .from('sector_statistics')
        .select('*')
        .limit(10);

      // Buscar estatísticas de veículos
      const { data: vehicleData } = await supabase
        .from('vehicle_statistics')
        .select('*')
        .limit(10);

      if (tripData) {
        const formattedTripData = tripData.map(item => ({
          ...item,
          month: new Date(item.month).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'short' 
          })
        }));
        setTripStats(formattedTripData);
      }

      if (sectorData) setSectorStats(sectorData);
      if (vehicleData) setVehicleStats(vehicleData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTrips = tripStats.reduce((sum, stat) => sum + stat.total_trips, 0);
  const completedTrips = tripStats.reduce((sum, stat) => sum + stat.completed_trips, 0);
  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;

  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6 lg:gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Test Center - Hidden by default */}
      <div data-email-test-center className="hidden">
        <EmailTestCenter />
      </div>
      
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Viagens concluídas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setores Ativos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sectorStats.length}</div>
            <p className="text-xs text-muted-foreground">Com viagens registradas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos em Uso</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleStats.filter(v => v.trip_count > 0).length}</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="trips">Viagens por Mês</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Viagens</CardTitle>
              <CardDescription>Quantidade de viagens realizadas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  total_trips: {
                    label: "Total de Viagens",
                    color: "hsl(var(--primary))",
                  },
                  completed_trips: {
                    label: "Viagens Concluídas",
                    color: "hsl(var(--secondary))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tripStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_trips" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Total de Viagens"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed_trips" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Viagens Concluídas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sectors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Viagens por Setor</CardTitle>
                <CardDescription>Distribuição das viagens entre setores</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    trip_count: {
                      label: "Número de Viagens",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorStats.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ sector_name, percent }) => 
                          `${sector_name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="trip_count"
                      >
                        {sectorStats.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Setores</CardTitle>
                <CardDescription>Setores com mais viagens</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    trip_count: {
                      label: "Viagens",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorStats.slice(0, 6)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis 
                        dataKey="sector_name" 
                        type="category" 
                        width={80}
                        fontSize={10}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="trip_count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilização de Veículos</CardTitle>
              <CardDescription>Frequência de uso dos veículos da frota</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  trip_count: {
                    label: "Número de Viagens",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[400px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleStats.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="vehicle_name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                    />
                    <YAxis fontSize={12} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        value,
                        `${props.payload.vehicle_name} (${props.payload.plate})`
                      ]}
                    />
                    <Bar dataKey="trip_count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}