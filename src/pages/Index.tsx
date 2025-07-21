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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Viagens</h2>
          <p className="text-muted-foreground">
            Gerencie e acompanhe as viagens da sua empresa
          </p>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="new-trip">Nova Viagem</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" key={refreshKey}>
            <TripCalendar />
          </TabsContent>

          <TabsContent value="new-trip">
            <div className="max-w-2xl">
              <TripForm onTripCreated={handleTripCreated} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
