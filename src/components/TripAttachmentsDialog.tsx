
import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Paperclip, FileText, Image as ImageIcon, Download, Eye, AlertCircle, Upload, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';

interface TripAttachmentsDialogProps {
  tripId: string | null;
  open: boolean;
  onClose: () => void;
}

interface Attachment {
  id: string;
  trip_id: string;
  employee_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

type AttachmentWithUrl = Attachment & { viewUrl?: string; downloadUrl?: string; signedError?: string };

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TripAttachmentsDialog({ tripId, open, onClose }: TripAttachmentsDialogProps) {
  const { toast } = useToast();
  const { isAdmin, isManager } = useUserRole();
  const { employee } = useCurrentEmployee();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se o usuário pode fazer upload para esta viagem
  const { data: tripData } = useQuery({
    queryKey: ['trip-for-upload', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('employee_ids, created_by')
        .eq('id', tripId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tripId && open
  });

  const canUpload = useMemo(() => {
    if (isAdmin || isManager) return true;
    if (!employee || !tripData) return false;
    
    // Verificar se o funcionário está associado à viagem
    return tripData.employee_ids?.includes(employee.id) || false;
  }, [isAdmin, isManager, employee, tripData]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['trip-attachments', tripId],
    queryFn: async () => {
      if (!tripId) return [] as AttachmentWithUrl[];
      const { data, error } = await supabase
        .from('trip_attachments')
        .select('id, trip_id, employee_id, file_name, file_path, file_type, file_size, uploaded_by, created_at')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const withUrls = await Promise.all(
        (data || []).map(async (att) => {
          const { data: view, error: viewErr } = await supabase.storage
            .from('trip-attachments')
            .createSignedUrl(att.file_path, 60 * 60);

          const { data: dl, error: dlErr } = await supabase.storage
            .from('trip-attachments')
            .createSignedUrl(att.file_path, 60 * 60, { download: att.file_name });

          if (viewErr || dlErr) {
            console.warn('Erro ao gerar link assinado:', viewErr?.message || dlErr?.message, 'para', att.file_path);
          }

          return { ...att, viewUrl: view?.signedUrl, downloadUrl: dl?.signedUrl, signedError: viewErr?.message } as AttachmentWithUrl;
        })
      );

      return withUrls;
    },
    enabled: open && !!tripId,
    meta: {
      onError: (err: unknown) => {
        console.error('Erro ao carregar anexos:', err);
      },
    },
  });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tripId || !canUpload) return;

    // Validar tamanho do arquivo (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 20MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Usar o employee_id do usuário atual se disponível, senão usar o primeiro da viagem
      let employeeId = employee?.id;
      
      if (!employeeId && tripData?.employee_ids && tripData.employee_ids.length > 0) {
        employeeId = tripData.employee_ids[0];
      }
      
      if (!employeeId) {
        toast({
          title: "Erro",
          description: "Não foi possível determinar um funcionário para associar o anexo.",
          variant: "destructive",
        });
        return;
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${tripId}/${employeeId}/${fileName}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('trip-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Criar registro na tabela
      const { error: dbError } = await supabase
        .from('trip_attachments')
        .insert({
          trip_id: tripId,
          employee_id: employeeId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Anexo enviado com sucesso!",
      });

      // Limpar input e recarregar dados
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro desconhecido ao enviar arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachment: AttachmentWithUrl) => {
    if (!attachment.id) return;
    
    setDeleting(attachment.id);
    
    try {
      // Verificar se o usuário pode deletar este anexo
      const { data: user } = await supabase.auth.getUser();
      const canDelete = isAdmin || isManager || attachment.uploaded_by === user.user?.id;
      
      if (!canDelete) {
        toast({
          title: "Erro",
          description: "Você não tem permissão para deletar este anexo.",
          variant: "destructive",
        });
        return;
      }

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('trip-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('trip_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Anexo deletado com sucesso!",
      });

      refetch();

    } catch (error: any) {
      console.error('Erro ao deletar anexo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro desconhecido ao deletar anexo.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const hasAnyMissingUrl = useMemo(
    () => (data?.some((a) => !a.viewUrl) ? true : false),
    [data]
  );

  useEffect(() => {
    if (open && hasAnyMissingUrl) {
      toast({
        title: 'Alguns anexos não puderam ser exibidos',
        description:
          'Se você acabou de enviar ou não tem acesso a esse arquivo, tente atualizar mais tarde ou contate o administrador.',
      });
    }
  }, [open, hasAnyMissingUrl, toast]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-travel-primary" />
            Anexos da Viagem
          </DialogTitle>
        </DialogHeader>
        
        {/* Seção de Upload */}
        {canUpload && (
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-travel-primary" />
              <span className="text-sm font-medium">
                Enviar Anexo {(isAdmin || isManager) ? '(Admin)' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Enviando arquivo...
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando anexos...
            </div>
          ) : (data && data.length > 0 ? (
            <>
              {hasAnyMissingUrl && (
                <div className="flex items-start gap-2 text-amber-600 bg-amber-100 border border-amber-200 rounded-md p-2 text-xs">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    Alguns arquivos aparecem listados, mas não foi possível gerar o link de visualização/baixa. Isso pode ser falta de permissão ou configuração de segurança. Tente novamente mais tarde.
                  </div>
                </div>
              )}
              <ScrollArea className="h-64 pr-2">
                <ul className="space-y-3">
                  {data.map((att) => (
                    <li key={att.id} className="flex items-center justify-between gap-3 p-3 rounded-md border bg-background">
                      <div className="flex items-center gap-3 min-w-0">
                        {att.file_type.startsWith('image') && att.viewUrl ? (
                          <a href={att.viewUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={att.viewUrl}
                              alt={`Pré-visualização de ${att.file_name}`}
                              className="h-12 w-12 rounded-md object-cover border"
                              loading="lazy"
                            />
                          </a>
                        ) : att.file_type.includes('pdf') ? (
                          <FileText className="h-5 w-5 text-travel-secondary shrink-0" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-travel-secondary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{att.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {att.file_type} • {formatBytes(att.file_size)}
                          </p>
                          {!att.viewUrl && (
                            <p className="text-[11px] text-amber-600 mt-1 truncate">
                              {att.signedError ? `Sem link: ${att.signedError}` : 'Sem link de visualização para este arquivo.'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {att.viewUrl || att.downloadUrl ? (
                          <>
                            {att.viewUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={att.viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visualizar ${att.file_name}`}>
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {att.downloadUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={att.downloadUrl} download target="_blank" rel="noopener noreferrer" aria-label={`Baixar ${att.file_name}`}>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Sem link</Badge>
                        )}
                        {/* Botão de deletar */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleting === att.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deleting === att.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o arquivo "{att.file_name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAttachment(att)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhum anexo enviado para esta viagem ainda.</div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
