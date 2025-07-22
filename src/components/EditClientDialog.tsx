import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  municipality?: string;
  contact?: string;
}

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({
  client,
  open,
  onOpenChange,
}: EditClientDialogProps) {
  const [name, setName] = useState(client.name);
  const [municipality, setMunicipality] = useState(client.municipality || "");
  const [contact, setContact] = useState(client.contact || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    setName(client.name);
    setMunicipality(client.municipality || "");
    setContact(client.contact || "");
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: async (clientData: { name: string; municipality?: string; contact?: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", client.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
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
      await updateClientMutation.mutateAsync({
        name: name.trim(),
        municipality: municipality.trim() || undefined,
        contact: contact.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Cliente *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-municipality">Município</Label>
            <Input
              id="edit-municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Digite o município"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact">Contato (Email ou Celular)</Label>
            <Input
              id="edit-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Digite o email ou celular"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}