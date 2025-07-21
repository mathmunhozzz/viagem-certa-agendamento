import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SectorFormProps {
  onSectorCreated: () => void;
}

export function SectorForm({ onSectorCreated }: SectorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do setor é obrigatório",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("sectors").insert({
        name: name.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Setor criado com sucesso!",
      });

      (e.target as HTMLFormElement).reset();
      onSectorCreated();
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar setor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Setor</CardTitle>
        <CardDescription>
          Cadastre um novo setor da empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Setor *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Recursos Humanos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descrição do setor (opcional)"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Setor"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}