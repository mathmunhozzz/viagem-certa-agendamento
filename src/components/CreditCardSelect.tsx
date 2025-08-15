import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard } from 'lucide-react';

interface CreditCardData {
  id: string;
  name: string;
  brand: string;
  last_four_digits: string;
}

interface CreditCardSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function CreditCardSelect({ 
  value, 
  onValueChange, 
  disabled = false,
  label = "Cartão de Crédito (Opcional)"
}: CreditCardSelectProps) {
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditCards = async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao carregar cartões:', error);
      } else {
        setCreditCards(data || []);
      }
      setLoading(false);
    };

    fetchCreditCards();
  }, []);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        {label}
      </Label>
      <Select 
        value={value || "none"} 
        onValueChange={(val) => onValueChange(val === "none" ? "" : val)}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione um cartão"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum cartão</SelectItem>
          {creditCards.map((card) => (
            <SelectItem key={card.id} value={card.id}>
              <div className="flex items-center gap-2">
                <span>{card.name}</span>
                <span className="text-muted-foreground text-sm">
                  ({card.brand} •••• {card.last_four_digits})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
