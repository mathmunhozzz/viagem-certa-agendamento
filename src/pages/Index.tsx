
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TripCalendar } from '@/components/TripCalendar';
import { TripForm } from '@/components/TripForm';
import { TripStats } from '@/components/TripStats';
import { TripList } from '@/components/TripList';
import { TripReports } from '@/components/TripReports';
import { VehicleForm } from '@/components/VehicleForm';
import { VehicleList } from '@/components/VehicleList';
import { SectorForm } from '@/components/SectorForm';
import { SectorList } from '@/components/SectorList';
import { EmployeeForm } from '@/components/EmployeeForm';
import { EmployeeList } from '@/components/EmployeeList';
import { UserRoleManager } from '@/components/UserRoleManager';
import { UserManagement } from '@/components/UserManagement';
import { PendingApprovalScreen } from '@/components/PendingApprovalScreen';
import { RoleGuard } from '@/components/RoleGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();
  const { hasRole, isManager } = useUserRole();
  const { accountStatus, loading: statusLoading, isApproved } = useAccountStatus();
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehicleRefreshKey, setVehicleRefreshKey] = useState(0);
  const [sectorRefreshKey, setSectorRefreshKey] = useState(0);
  const [employeeRefreshKey, setEmployeeRefreshKey] = useState(0);
  const [showUserManagement, setShowUserManagement] = useState(false);

  if (loading || statusLoading) {
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

  // Verificar se a conta está aprovada (exceto para admins)
  if (!isApproved && !hasRole('admin')) {
    return <PendingApprovalScreen 
      status={accountStatus || 'pending'} 
      userName={user.user_metadata?.name || user.email?.split('@')[0]} 
    />;
  }

  // Mostrar gerenciamento de usuários se solicitado
  if (showUserManagement && hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header onShowUserManagement={() => setShowUserManagement(false)} />
        <UserManagement />
      </div>
    );
  }

  const handleTripCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleVehicleCreated = () => {
    setVehicleRefreshKey(prev => prev + 1);
  };

  const handleSectorCreated = () => {
    setSectorRefreshKey(prev => prev + 1);
  };

  const handleEmployeeCreated = () => {
    setEmployeeRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header onShowUserManagement={hasRole('admin') ? () => setShowUserManagement(true) : undefined} />
      <main className="container mx-auto py-4 md:py-8 px-4">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <div className="text-center space-y-2 md:space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-travel-primary via-travel-secondary to-travel-accent bg-clip-text text-transparent">
              Dashboard de Viagens
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
              Sistema completo para gestão e acompanhamento de viagens da Opportunity
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <TripStats />

        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex justify-center px-2">
            <TabsList className={`grid w-full max-w-7xl ${hasRole('admin') ? 'grid-cols-4 md:grid-cols-8' : 'grid-cols-3 md:grid-cols-7'} bg-muted/50 p-1 h-auto md:h-12 text-xs md:text-sm gap-1`}>
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">📅</span>
                <span className="hidden md:block">📅 Calendário</span>
              </TabsTrigger>
              <TabsTrigger 
                value="new-trip" 
                className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">➕</span>
                <span className="hidden md:block">➕ Nova Viagem</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trips-list" 
                className="data-[state=active]:bg-travel-accent data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">📋</span>
                <span className="hidden md:block">📋 Viagens</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">📊</span>
                <span className="hidden md:block">📊 Relatórios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sectors" 
                className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">🏢</span>
                <span className="hidden md:block">🏢 Setores</span>
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="data-[state=active]:bg-travel-accent data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">👥</span>
                <span className="hidden md:block">👥 Funcionários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vehicles" 
                className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
              >
                <span className="block md:hidden">🚗</span>
                <span className="hidden md:block">🚗 Carros</span>
              </TabsTrigger>
              {hasRole('admin') && (
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">⚙️</span>
                  <span className="hidden md:block">⚙️ Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="calendar" key={refreshKey} className="space-y-6">
            <TripCalendar />
          </TabsContent>

          <TabsContent value="new-trip" className="space-y-6">
            <RoleGuard requiredRole="manager" fallback={
              <div className="max-w-3xl mx-auto">
                <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">Apenas gerentes e administradores podem criar novas viagens.</p>
                </div>
              </div>
            }>
              <div className="max-w-3xl mx-auto">
                <TripForm onTripCreated={handleTripCreated} />
              </div>
            </RoleGuard>
          </TabsContent>

          <TabsContent value="trips-list" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <TripList onTripUpdated={handleTripCreated} />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <TripReports />
            </div>
          </TabsContent>

          <TabsContent value="sectors" className="space-y-6">
            <RoleGuard requiredRole="manager" fallback={
              <div className="max-w-4xl mx-auto">
                <SectorList refreshKey={sectorRefreshKey} />
              </div>
            }>
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectorForm onSectorCreated={handleSectorCreated} />
                <SectorList refreshKey={sectorRefreshKey} />
              </div>
            </RoleGuard>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <RoleGuard requiredRole="manager" fallback={
              <div className="max-w-6xl mx-auto">
                <EmployeeList refreshKey={employeeRefreshKey} />
              </div>
            }>
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmployeeForm onEmployeeCreated={handleEmployeeCreated} />
                <EmployeeList refreshKey={employeeRefreshKey} />
              </div>
            </RoleGuard>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <RoleGuard requiredRole="manager" fallback={
              <div className="max-w-6xl mx-auto">
                <VehicleList key={vehicleRefreshKey} />
              </div>
            }>
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VehicleForm onVehicleCreated={handleVehicleCreated} />
                <VehicleList key={vehicleRefreshKey} />
              </div>
            </RoleGuard>
          </TabsContent>

          {hasRole('admin') && (
            <TabsContent value="admin" className="space-y-6">
              <div className="max-w-6xl mx-auto">
                <UserRoleManager />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
