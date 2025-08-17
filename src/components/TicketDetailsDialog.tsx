
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

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

interface Comment {
  id: string;
  message: string;
  created_at: string;
  author_user_id: string;
  author_name?: string;
}

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated: () => void;
}

export function TicketDetailsDialog({ ticket, open, onOpenChange, onTicketUpdated }: TicketDetailsDialogProps) {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    priority: '',
    assigned_to: '',
  });

  const canEdit = ticket && (
    isAdmin ||
    isManager ||
    ticket.created_by === user?.id ||
    (ticket.assigned_to && ticket.assigned_employee)
  );

  useEffect(() => {
    if (ticket && open) {
      fetchComments();
      setEditData({
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to || '',
      });
    }
  }, [ticket, open]);

  const fetchComments = async () => {
    if (!ticket) return;

    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos autores dos comentários
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', comment.author_user_id)
              .single();

            return {
              ...comment,
              author_name: profileData?.name || 'Usuário'
            };
          } catch {
            return {
              ...comment,
              author_name: 'Usuário'
            };
          }
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticket.id,
          author_user_id: user.id,
          message: newComment.trim()
        }]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      
      toast({
        title: "Sucesso",
        description: "Comentário adicionado!"
      });
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: editData.status,
          priority: editData.priority,
          assigned_to: editData.assigned_to || null
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ticket atualizado com sucesso!"
      });

      setIsEditing(false);
      onTicketUpdated();
    } catch (error: any) {
      console.error('Erro ao atualizar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ticket.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  const statusLabels = {
    pendente: 'Pendente',
    em_analise: 'Em Análise',
    corrigido: 'Corrigido',
    negado: 'Negado'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{ticket.title}</span>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalhes do Ticket */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {ticket.description || 'Nenhuma descrição fornecida.'}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comentários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de comentários */}
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Novo comentário */}
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Laterais */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_analise">Em Análise</SelectItem>
                          <SelectItem value="corrigido">Corrigido</SelectItem>
                          <SelectItem value="negado">Negado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Prioridade</Label>
                      <Select
                        value={editData.priority}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleUpdateTicket}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <p>
                        <Badge variant="outline">
                          {statusLabels[ticket.status]}
                        </Badge>
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <p>
                        <Badge variant="outline">
                          {ticket.priority}
                        </Badge>
                      </p>
                    </div>

                    {ticket.assigned_employee && (
                      <div>
                        <Label className="text-sm font-medium">Responsável</Label>
                        <p className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2" />
                          {ticket.assigned_employee.name}
                        </p>
                      </div>
                    )}

                    {ticket.sector && (
                      <div>
                        <Label className="text-sm font-medium">Setor</Label>
                        <p className="text-sm">{ticket.sector.name}</p>
                      </div>
                    )}

                    {ticket.due_date && (
                      <div>
                        <Label className="text-sm font-medium">Data Limite</Label>
                        <p className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(ticket.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Criado em</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Atualizado em</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ticket.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
