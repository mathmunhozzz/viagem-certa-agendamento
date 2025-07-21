import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TripCalendar } from '@/components/TripCalendar';
import { TripForm } from '@/components/TripForm';
import { TripStats } from '@/components/TripStats';
import { TripList } from '@/components/TripList';
import { VehicleForm } from '@/components/VehicleForm';
import { VehicleList } from '@/components/VehicleList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehicleRefreshKey, setVehicleRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleTripCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleVehicleCreated = () => {
    setVehicleRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-travel-primary via-travel-secondary to-travel-accent bg-clip-text text-transparent">
              Dashboard de Viagens Corporativas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sistema completo para gestão e acompanhamento de viagens empresariais
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <TripStats />

        <Tabs defaultValue="calendar" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-4xl grid-cols-5 bg-muted/50 p-1 h-12">
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold"
              >
                📅 Calendário
              </TabsTrigger>
              <TabsTrigger 
                value="new-trip" 
                className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold"
              >
                ➕ Nova Viagem
              </TabsTrigger>
              <TabsTrigger 
                value="trips-list" 
                className="data-[state=active]:bg-travel-accent data-[state=active]:text-white font-semibold"
              >
                📋 Viagens
              </TabsTrigger>
              <TabsTrigger 
                value="vehicles" 
                className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold"
              >
                🚗 Carros
              </TabsTrigger>
              <TabsTrigger 
                value="new-vehicle" 
                className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold"
              >
                🔧 Novo Carro
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" key={refreshKey} className="space-y-6">
            <TripCalendar />
          </TabsContent>

          <TabsContent value="new-trip" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <TripForm onTripCreated={handleTripCreated} />
            </div>
          </TabsContent>

          <TabsContent value="trips-list" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <TripList onTripUpdated={handleTripCreated} />
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <VehicleList key={vehicleRefreshKey} />
            </div>
          </TabsContent>

          <TabsContent value="new-vehicle" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <VehicleForm onVehicleCreated={handleVehicleCreated} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
