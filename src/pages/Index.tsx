import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TripCalendar } from '@/components/TripCalendar';
import { TripForm } from '@/components/TripForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-travel-primary via-travel-secondary to-travel-accent bg-clip-text text-transparent">
              Dashboard de Viagens
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Gerencie e acompanhe as viagens corporativas da sua empresa com eficiência e organização
            </p>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 h-12">
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
