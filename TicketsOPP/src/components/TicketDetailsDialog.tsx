import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Tag, User, Clock, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

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
  profiles?: {
    name: string;
  };
}

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated: () => void;
}

export function TicketDetailsDialog({ ticket, open, onOpenChange, onTicketUpdated }: TicketDetailsDialogProps) {
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: '' as 'pendente' | 'em_analise' | 'corrigido' | 'negado',
    priority: '',
    assigned_to: '',
  });
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const canEdit = ticket && (
    hasRole('admin') || 
    hasRole('manager') || 
    ticket.created_by === user?.id ||
    (ticket.assigned_to && employees.find(emp => emp.id === ticket.assigned_to)?.name)
  );

  useEffect(() => {
    if (ticket && open) {
      fetchComments();
      fetchEmployees();
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
        .select(`
          *,
          profiles!inner(name)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          author_user_id: user.id,
          message: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: editData.status,
          priority: editData.priority,
          assigned_to: editData.assigned_to || null,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      setIsEditing(false);
      onTicketUpdated();
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
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

  const priorityLabels = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{ticket.title}</span>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descrição */}
          {ticket.description && (
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
            </div>
          )}

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {ticket.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Comentários */}
          <div>
            <Label className="text-sm font-medium">Comentários</Label>
            <div className="space-y-3 mt-2">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {comment.profiles?.name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm">{comment.message}</p>
                </div>
              ))}
            </div>

            {/* Adicionar comentário */}
            <div className="flex gap-2 mt-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Enviar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Informações do ticket */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={editData.status}
                  onValueChange={(value: 'pendente' | 'em_analise' | 'corrigido' | 'negado') => 
                    setEditData(prev => ({ ...prev, status: value }))
                  }
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
              ) : (
                <Badge className="mt-1">{statusLabels[ticket.status]}</Badge>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Prioridade</Label>
              {isEditing ? (
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
              ) : (
                <Badge variant="outline" className="mt-1">
                  {priorityLabels[ticket.priority as keyof typeof priorityLabels] || ticket.priority}
                </Badge>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" />
                Responsável
              </Label>
              {isEditing ? (
                <Select
                  value={editData.assigned_to}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.assigned_employee?.name || 'Não atribuído'}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Setor</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.sector?.name || 'Não especificado'}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Data de Vencimento
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.due_date 
                  ? new Date(ticket.due_date).toLocaleDateString('pt-BR')
                  : 'Não definida'
                }
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Criado em</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(ticket.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTicket} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}