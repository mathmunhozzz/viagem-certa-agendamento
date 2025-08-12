
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Paperclip, FileText, Image as ImageIcon, Download, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  created_at: string;
}

type AttachmentWithUrl = Attachment & { url?: string; signedError?: string };

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TripAttachmentsDialog({ tripId, open, onClose }: TripAttachmentsDialogProps) {
  const { toast } = useToast();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['trip-attachments', tripId],
    queryFn: async () => {
      if (!tripId) return [] as AttachmentWithUrl[];
      const { data, error } = await supabase
        .from('trip_attachments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const withUrls = await Promise.all(
        (data || []).map(async (att) => {
          const { data: signed, error: signedErr } = await supabase.storage
            .from('trip-attachments')
            .createSignedUrl(att.file_path, 60 * 60, { download: att.file_name }); // 1h, força nome no download

          if (signedErr) {
            console.warn('Erro ao gerar link assinado:', signedErr.message, 'para', att.file_path);
          }

          return { ...att, url: signed?.signedUrl, signedError: signedErr?.message } as AttachmentWithUrl;
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

  const hasAnyMissingUrl = useMemo(
    () => (data?.some((a) => !a.url) ? true : false),
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
                        {att.file_type.startsWith('image') && att.url ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={att.url}
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
                          {!att.url && (
                            <p className="text-[11px] text-amber-600 mt-1 truncate">
                              {att.signedError ? `Sem link: ${att.signedError}` : 'Sem link de visualização/baixa para este arquivo.'}
                            </p>
                          )}
                        </div>
                      </div>
                      {att.url ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={att.url} target="_blank" rel="noopener noreferrer" aria-label={`Visualizar ${att.file_name}`}>
                              <Eye className="h-4 w-4 mr-1" /> Visualizar
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={att.url} download target="_blank" rel="noopener noreferrer" aria-label={`Baixar ${att.file_name}`}>
                              <Download className="h-4 w-4 mr-1" /> Baixar
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">Sem link</Badge>
                      )}
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
