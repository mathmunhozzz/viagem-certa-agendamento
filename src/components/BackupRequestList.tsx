import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database, Clock, CheckCircle, XCircle, Copy, ExternalLink, MessageSquare, User, Monitor } from 'lucide-react';
import { BackupRequestResponseDialog } from './BackupRequestResponseDialog';

interface BackupRequest {
  id: string;
  user_id: string;
  city_name: string;
  system_name: string | null;
  reason: string;
  status: string;
  admin_observation: string | null;
  download_link: string | null;
  created_at: string;
  approved_at: string | null;
  profiles?: {
    name: string;
  };
}

interface BackupRequestListProps {
  refreshTrigger?: number;
}

export function BackupRequestList({ refreshTrigger }: BackupRequestListProps) {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<BackupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BackupRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile names for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile || undefined,
          } as BackupRequest;
        })
      );
      
      setRequests(requestsWithProfiles);
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && user) {
      fetchRequests();
    }
  }, [refreshTrigger, user, roleLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado para a área de transferência!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRespond = (request: BackupRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  if (loading || roleLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Database className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {isAdmin ? 'Nenhuma solicitação de backup encontrada' : 'Você ainda não fez nenhuma solicitação de backup'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isAdmin ? 'Todas as Solicitações de Backup' : 'Minhas Solicitações'}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Gerencie as solicitações de backup dos usuários'
              : 'Acompanhe o status das suas solicitações'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{request.city_name}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    {request.system_name && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Monitor className="h-3.5 w-3.5" />
                        <span>Sistema: <strong>{request.system_name}</strong></span>
                      </div>
                    )}
                    
                    {isAdmin && request.profiles?.name && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Solicitante: <strong>{request.profiles.name}</strong></span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Solicitado em {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {isAdmin && request.status === 'pending' && (
                    <Button onClick={() => handleRespond(request)} size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  )}
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-sm font-medium mb-1">Motivo:</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>

                {request.admin_observation && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Observação do Admin:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{request.admin_observation}</p>
                  </div>
                )}

                {request.status === 'approved' && request.download_link && (
                  <div className="bg-green-50 dark:bg-green-950 rounded p-3 border border-green-200 dark:border-green-800 space-y-2">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Link para Download:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded break-all flex-1">
                        {request.download_link}
                      </code>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(request.download_link!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(request.download_link!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="bg-red-50 dark:bg-red-950 rounded p-3 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Esta solicitação foi rejeitada.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <BackupRequestResponseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        onSuccess={fetchRequests}
      />
    </>
  );
}
