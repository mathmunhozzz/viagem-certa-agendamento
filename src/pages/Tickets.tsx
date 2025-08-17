
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { PendingApprovalScreen } from '@/components/PendingApprovalScreen';
import { TicketBoard } from '@/components/TicketBoard';
import { Header } from '@/components/Header';

const Tickets = () => {
  const { user, loading: authLoading } = useAuth();
  const { accountStatus, loading: statusLoading } = useAccountStatus();

  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  if (accountStatus !== 'approved') {
    return <PendingApprovalScreen status={accountStatus || 'pending'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <TicketBoard />
      </main>
    </div>
  );
};

export default Tickets;
