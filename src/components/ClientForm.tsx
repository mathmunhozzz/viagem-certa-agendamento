import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ClientForm() {
  const [name, setName] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: async (clientData: { name: string; municipality?: string; contact?: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
      setName("");
      setMunicipality("");
      setContact("");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createClientMutation.mutateAsync({
        name: name.trim(),
        municipality: municipality.trim() || undefined,
        contact: contact.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="municipality">Município</Label>
            <Input
              id="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Digite o município"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contato (Email ou Celular)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Digite o email ou celular"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}