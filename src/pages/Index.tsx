
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TripCalendar } from '@/components/TripCalendar';
import { TripForm } from '@/components/TripForm';
import { TripStats } from '@/components/TripStats';
import { TripDashboard } from '@/components/TripDashboard';
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
import { ClientForm } from '@/components/ClientForm';
import { ClientList } from '@/components/ClientList';
import { EmployeeUserLink } from '@/components/EmployeeUserLink';
import { EmployeeTripView } from '@/components/EmployeeTripView';
import { EmployeeWeekCalendar } from '@/components/EmployeeWeekCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();
  const { hasRole, isManager } = useUserRole();
  const { accountStatus, loading: statusLoading, isApproved } = useAccountStatus();
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehicleRefreshKey, setVehicleRefreshKey] = useState(0);
  const [sectorRefreshKey, setSectorRefreshKey] = useState(0);
  const [employeeRefreshKey, setEmployeeRefreshKey] = useState(0);
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
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

  const handleClientCreated = () => {
    setClientRefreshKey(prev => prev + 1);
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

        <Tabs defaultValue={(hasRole('admin') || hasRole('manager')) ? "trips-list" : "employee-calendar"} className="space-y-6">
          <div className="flex justify-center px-2">
            <TabsList className={`grid w-full max-w-7xl ${hasRole('admin') ? 'grid-cols-6 md:grid-cols-11' : hasRole('manager') ? 'grid-cols-5 md:grid-cols-10' : 'grid-cols-1'} bg-muted/50 p-1 h-auto md:h-12 text-xs md:text-sm gap-1`}>
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="calendar" 
                  className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">📅</span>
                  <span className="hidden md:block">📅 Calendário</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">📊</span>
                  <span className="hidden md:block">📊 Dashboard</span>
                </TabsTrigger>
              )}
              {!hasRole('admin') && !hasRole('manager') && (
                <TabsTrigger 
                  value="employee-calendar" 
                  className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">📅</span>
                  <span className="hidden md:block">📅 Calendário Semanal</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="new-trip" 
                  className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">➕</span>
                  <span className="hidden md:block">➕ Nova Viagem</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="trips-list" 
                  className="data-[state=active]:bg-travel-accent data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">📋</span>
                  <span className="hidden md:block">📋 Viagens</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="reports" 
                  className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">📊</span>
                  <span className="hidden md:block">📊 Relatórios</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="clients" 
                  className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">👥</span>
                  <span className="hidden md:block">👥 Clientes</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="sectors" 
                  className="data-[state=active]:bg-travel-secondary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">🏢</span>
                  <span className="hidden md:block">🏢 Setores</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="employees" 
                  className="data-[state=active]:bg-travel-accent data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">🧑‍💼</span>
                  <span className="hidden md:block">🧑‍💼 Funcionários</span>
                </TabsTrigger>
              )}
              {(hasRole('admin') || hasRole('manager')) && (
                <TabsTrigger 
                  value="vehicles" 
                  className="data-[state=active]:bg-travel-primary data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                >
                  <span className="block md:hidden">🚗</span>
                  <span className="hidden md:block">🚗 Carros</span>
                </TabsTrigger>
              )}
              {hasRole('admin') && (
                <>
                  <TabsTrigger 
                    value="employee-link" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                  >
                    <span className="block md:hidden">🔗</span>
                    <span className="hidden md:block">🔗 Vincular</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-semibold p-2 md:p-3 text-center min-h-[2.5rem]"
                  >
                    <span className="block md:hidden">👤</span>
                    <span className="hidden md:block">👤 Usuários</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="calendar" key={refreshKey} className="space-y-6">
              <TripCalendar />
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="dashboard" className="space-y-6">
              <div className="max-w-7xl mx-auto">
                <TripDashboard />
              </div>
            </TabsContent>
          )}

          {!hasRole('admin') && !hasRole('manager') && (
            <TabsContent value="employee-calendar" className="space-y-6">
              <div className="max-w-6xl mx-auto">
                <EmployeeWeekCalendar />
              </div>
              <div className="max-w-6xl mx-auto">
                <EmployeeTripView />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="new-trip" className="space-y-6">
              <div className="max-w-3xl mx-auto">
                <TripForm onTripCreated={handleTripCreated} />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="trips-list" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <TripList onTripUpdated={handleTripCreated} />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="reports" className="space-y-6">
              <div className="max-w-7xl mx-auto">
                <TripReports />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="clients" className="space-y-6">
              <RoleGuard requiredRole="manager" fallback={
                <div className="max-w-6xl mx-auto">
                  <ClientList />
                </div>
              }>
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ClientForm />
                  <ClientList />
                </div>
              </RoleGuard>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="sectors" className="space-y-6">
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectorForm onSectorCreated={handleSectorCreated} />
                <SectorList refreshKey={sectorRefreshKey} />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="employees" className="space-y-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmployeeForm onEmployeeCreated={handleEmployeeCreated} />
                <EmployeeList refreshKey={employeeRefreshKey} />
              </div>
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="vehicles" className="space-y-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VehicleForm onVehicleCreated={handleVehicleCreated} />
                <VehicleList key={vehicleRefreshKey} />
              </div>
            </TabsContent>
          )}

          {hasRole('admin') && (
            <>
              <TabsContent value="employee-link" className="space-y-6">
                <div className="max-w-6xl mx-auto">
                  <EmployeeUserLink />
                </div>
              </TabsContent>
              <TabsContent value="users" className="space-y-6">
                <div className="max-w-6xl mx-auto">
                  <UserManagement />
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
