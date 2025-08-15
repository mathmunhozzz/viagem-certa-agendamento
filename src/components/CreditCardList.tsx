import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CreditCardData {
  id: string;
  name: string;
  brand: string;
  last_four_digits: string;
  created_at: string;
}

interface CreditCardListProps {
  refreshTrigger: number;
}

export function CreditCardList({ refreshTrigger }: CreditCardListProps) {
  const { toast } = useToast();
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCreditCards = async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar cartões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cartões de crédito.",
        variant: "destructive",
      });
    } else {
      setCreditCards(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', deleteId);

    if (error) {
      console.error('Erro ao deletar cartão:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar cartão de crédito.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cartão de crédito deletado com sucesso!",
      });
      fetchCreditCards();
    }
    
    setDeleting(false);
    setDeleteId(null);
  };

  useEffect(() => {
    fetchCreditCards();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartões de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando cartões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartões de Crédito ({creditCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditCards.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum cartão de crédito cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {creditCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{card.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.brand} •••• {card.last_four_digits}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(card.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este cartão de crédito? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}