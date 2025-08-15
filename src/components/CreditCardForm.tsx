import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Plus } from 'lucide-react';

interface CreditCardFormProps {
  onCreditCardCreated: () => void;
}

export function CreditCardForm({ onCreditCardCreated }: CreditCardFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    last_four_digits: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.brand.trim() || !formData.last_four_digits.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{4}$/.test(formData.last_four_digits)) {
      toast({
        title: "Erro",
        description: "Os últimos 4 dígitos devem conter exatamente 4 números.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('credit_cards')
      .insert([{
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        last_four_digits: formData.last_four_digits.trim()
      }]);

    if (error) {
      console.error('Erro ao criar cartão:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cartão de crédito. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cartão de crédito cadastrado com sucesso!",
      });
      
      setFormData({
        name: '',
        brand: '',
        last_four_digits: ''
      });
      
      onCreditCardCreated();
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cadastrar Novo Cartão de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Cartão *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Cartão Corporativo Principal"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="brand">Bandeira *</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Ex: Visa, Mastercard, Elo"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="last_four_digits">Últimos 4 Dígitos *</Label>
            <Input
              id="last_four_digits"
              value={formData.last_four_digits}
              onChange={(e) => setFormData(prev => ({ ...prev, last_four_digits: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Ex: 1234"
              maxLength={4}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Cadastrando...' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}