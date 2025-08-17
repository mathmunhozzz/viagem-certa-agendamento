import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreateTicketDialog } from './CreateTicketDialog';
import { TicketDetailsDialog } from './TicketDetailsDialog';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_analise' | 'corrigido' | 'negado';
  priority: string;
  created_by: string;
  assigned_to: string | null;
  sector_id: string | null;
  tags: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_employee?: {
    name: string;
  };
  sector?: {
    name: string;
  };
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  corrigido: { label: 'Corrigido', color: 'bg-green-100 text-green-800 border-green-200' },
  negado: { label: 'Negado', color: 'bg-red-100 text-red-800 border-red-200' }
};

const priorityConfig = {
  baixa: { color: 'bg-gray-100 text-gray-700' },
  media: { color: 'bg-yellow-100 text-yellow-700' },
  alta: { color: 'bg-orange-100 text-orange-700' },
  critica: { color: 'bg-red-100 text-red-700' }
};

export function TicketBoard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_employee:employees!assigned_to(name),
          sector:sectors(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Erro ao carregar tickets:', error);
      setError('Não foi possível carregar os tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const handleTicketCreated = () => {
    fetchTickets();
    setShowCreateDialog(false);
  };

  const handleTicketUpdated = () => {
    fetchTickets();
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button onClick={fetchTickets} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sistema de Tickets</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="space-y-4">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{config.label}</span>
                  <Badge variant="secondary">
                    {getTicketsByStatus(status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              {getTicketsByStatus(status).map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {ticket.title}
                      </h3>
                      
                      {ticket.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityConfig[ticket.priority as keyof typeof priorityConfig]?.color || 'bg-gray-100'}`}
                        >
                          {ticket.priority}
                        </Badge>
                        
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {ticket.assigned_employee && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.assigned_employee.name}
                          </div>
                        )}
                        
                        {ticket.due_date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(ticket.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTicketCreated={handleTicketCreated}
      />

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  );
}