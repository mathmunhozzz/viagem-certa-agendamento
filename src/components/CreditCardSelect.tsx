import { useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CreditCard {
  id: string;
  name: string;
  number: string;
  isUsed: boolean; // Novo: indica se o cartão já está em outra viagem
}

interface CreditCardSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function CreditCardSelect({ value, onValueChange }: CreditCardSelectProps) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      try {
        // Buscar cartões cadastrados
        const { data: allCards, error: cardsError } = await supabase
          .from('credit_cards')
          .select('id, name, number');

        if (cardsError) throw cardsError;

        // Buscar cartões que já estão sendo usados em viagens futuras
        const { data: usedTrips, error: tripsError } = await supabase
          .from('trips')
          .select('credit_card_id')
          .gt('trip_date', new Date().toISOString().split('T')[0]); // viagens futuras

        if (tripsError) throw tripsError;

        const usedCardIds = usedTrips?.map(t => t.credit_card_id) || [];

        // Mapear cartões e marcar os usados
        const mappedCards: CreditCard[] = (allCards || []).map(card => ({
          ...card,
          isUsed: usedCardIds.includes(card.id)
        }));

        setCards(mappedCards);
      } catch (err) {
        console.error('Erro ao buscar cartões:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, []);

  return (
    <Select.Root
      value={value && cards.find(c => c.id === value) ? value : undefined}
      onValueChange={(val) => {
        const selectedCard = cards.find(c => c.id === val);
        if (!selectedCard?.isUsed) onValueChange(val); // não permite selecionar cartão já usado
      }}
    >
      <Select.Trigger
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 border rounded-md',
          'border-gray-300 bg-white text-left text-sm'
        )}
      >
        <Select.Value placeholder={loading ? 'Carregando cartões...' : 'Selecione um cartão'} />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Content className="bg-white border border-gray-300 rounded-md mt-1 shadow-md z-50">
        <Select.ScrollUpButton className="flex justify-center p-1">
          <ChevronUp className="w-4 h-4" />
        </Select.ScrollUpButton>
        <Select.Viewport>
          {cards.length === 0 && !loading && (
            <div className="p-2 text-gray-500 text-sm">Nenhum cartão disponível</div>
          )}
          {cards.map(card => (
            <Select.Item
              key={card.id}
              value={card.id}
              disabled={card.isUsed} // desabilita visualmente se já usado
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded',
                card.isUsed
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-100 focus:bg-gray-100'
              )}
            >
              <Select.ItemText>
                {card.name} •••• {card.number.slice(-4)}
                {card.isUsed && ' (Em uso)'}
              </Select.ItemText>
              {!card.isUsed && (
                <Select.ItemIndicator>
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
              )}
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton className="flex justify-center p-1">
          <ChevronDown className="w-4 h-4" />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  );
}
