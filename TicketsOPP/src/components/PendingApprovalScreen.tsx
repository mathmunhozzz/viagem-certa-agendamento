import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface PendingApprovalScreenProps {
  status: string;
}

export function PendingApprovalScreen({ status }: PendingApprovalScreenProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Conta Aprovada',
          description: 'Sua conta foi aprovada! Você já pode acessar o sistema.',
          variant: 'default' as const,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Conta Rejeitada',
          description: 'Sua conta foi rejeitada. Entre em contato com o administrador para mais informações.',
          variant: 'destructive' as const,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: Clock,
          title: 'Aguardando Aprovação',
          description: 'Sua conta está sendo analisada pelo administrador. Você receberá uma notificação quando for aprovada.',
          variant: 'default' as const,
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-600'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className={statusInfo.bgColor}>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-white">
              <Icon className={`h-6 w-6 ${statusInfo.iconColor}`} />
            </div>
            <CardTitle className="mt-4">{statusInfo.title}</CardTitle>
            <CardDescription className="mt-2">
              Sistema de Gerenciamento de Tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant={statusInfo.variant}>
              <AlertDescription>
                {statusInfo.description}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}