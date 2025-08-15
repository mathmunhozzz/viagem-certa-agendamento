import { useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CreditCard {
  id: string;
  name: string;
  number: string;
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
        const { data, error } = await supabase
          .from('credit_cards')
          .select('id, name, number');

        if (error) throw error;

        setCards(data || []);
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
      onValueChange={onValueChange}
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
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm cursor-pointer',
                'hover:bg-gray-100 focus:bg-gray-100 rounded'
              )}
            >
              <Select.ItemText>{card.name} •••• {card.number.slice(-4)}</Select.ItemText>
              <Select.ItemIndicator>
                <Check className="w-4 h-4" />
              </Select.ItemIndicator>
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
