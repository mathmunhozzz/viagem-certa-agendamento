import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Paperclip, FileText, Image as ImageIcon, Download, Eye } from 'lucide-react';

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

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TripAttachmentsDialog({ tripId, open, onClose }: TripAttachmentsDialogProps) {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['trip-attachments', tripId],
    queryFn: async () => {
      if (!tripId) return [] as Array<Attachment & { url?: string }>;
      const { data, error } = await supabase
        .from('trip_attachments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const withUrls = await Promise.all((data || []).map(async (att) => {
        const { data: signed } = await supabase
          .storage
          .from('trip-attachments')
          .createSignedUrl(att.file_path, 60 * 60); // 1h
        return { ...att, url: signed?.signedUrl };
      }));

      return withUrls;
    },
    enabled: open && !!tripId,
  });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

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
            <ScrollArea className="h-64 pr-2">
              <ul className="space-y-3">
                {data.map((att) => (
                  <li key={att.id} className="flex items-center justify-between gap-3 p-3 rounded-md border bg-background">
                    <div className="flex items-center gap-3 min-w-0">
                      {att.file_type.startsWith('image') && att.url ? (
                        <img
                          src={att.url}
                          alt={`Pré-visualização de ${att.file_name}`}
                          className="h-12 w-12 rounded-md object-cover border"
                          loading="lazy"
                        />
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
          ) : (
            <div className="text-sm text-muted-foreground">Nenhum anexo enviado para esta viagem ainda.</div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
