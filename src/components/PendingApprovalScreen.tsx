import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingApprovalScreenProps {
  status: string;
  userName?: string;
}

export const PendingApprovalScreen = ({ status, userName }: PendingApprovalScreenProps) => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Conta Pendente de Aprovação',
          message: 'Sua conta foi criada com sucesso, mas precisa ser aprovada por um administrador antes de você poder acessar o sistema.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'rejected':
        return {
          icon: <Mail className="h-12 w-12 text-red-500" />,
          title: 'Conta Rejeitada',
          message: 'Sua conta foi rejeitada pelo administrador. Entre em contato com o suporte para mais informações.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Clock className="h-12 w-12 text-gray-500" />,
          title: 'Status da Conta',
          message: 'Verificando status da sua conta...',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className={`${content.bgColor} ${content.borderColor} border-2`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {content.icon}
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              {content.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {userName && (
              <p className="text-sm text-gray-600">
                Olá, <span className="font-medium">{userName}</span>!
              </p>
            )}
            
            <p className="text-gray-700 leading-relaxed">
              {content.message}
            </p>

            {status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>O que fazer agora?</strong><br />
                  Aguarde a aprovação do administrador. Você receberá acesso assim que sua conta for aprovada.
                </p>
              </div>
            )}

            {status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-800">
                  <strong>Conta rejeitada</strong><br />
                  Entre em contato com o administrador para mais informações sobre o motivo da rejeição.
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};