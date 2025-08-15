import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreditCard {
  id: string;
  name: string;
}

interface CreditCardSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function CreditCardSelect({ value, onValueChange }: CreditCardSelectProps) {
  const [cards, setCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setCards(data);
      }
    };

    fetchCards();
  }, []);

  return (
    <Select
      value={value || undefined} // evita string vazia
      onValueChange={(val) => onValueChange(val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione o cartão de crédito" />
      </SelectTrigger>
      <SelectContent>
        {cards.map((card) => (
          <SelectItem key={card.id} value={card.id}>
            {card.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
