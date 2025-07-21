import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Sector {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  onEmployeeCreated: () => void;
}

export function EmployeeForm({ onEmployeeCreated }: EmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const { data, error } = await supabase
          .from("sectors")
          .select("id, name")
          .order("name");

        if (error) throw error;
        setSectors(data || []);
      } catch (error) {
        console.error("Erro ao buscar setores:", error);
      }
    };

    fetchSectors();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const position = formData.get("position") as string;

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do funcionário é obrigatório",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (selectedSectors.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um setor",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Criar funcionário
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .insert({
          name: name.trim(),
          email: email.trim() || null,
          position: position.trim() || null,
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Associar aos setores
      const sectorAssociations = selectedSectors.map(sectorId => ({
        employee_id: employee.id,
        sector_id: sectorId,
      }));

      const { error: associationError } = await supabase
        .from("employee_sectors")
        .insert(sectorAssociations);

      if (associationError) throw associationError;

      toast({
        title: "Sucesso",
        description: "Funcionário criado com sucesso!",
      });

      (e.target as HTMLFormElement).reset();
      setSelectedSectors([]);
      onEmployeeCreated();
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar funcionário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectors([...selectedSectors, sectorId]);
    } else {
      setSelectedSectors(selectedSectors.filter(id => id !== sectorId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Funcionário</CardTitle>
        <CardDescription>
          Cadastre um novo funcionário e associe aos setores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="joao.silva@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              name="position"
              placeholder="Ex: Analista de RH"
            />
          </div>

          <div className="space-y-2">
            <Label>Setores *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {sectors.map((sector) => (
                <div key={sector.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={sector.id}
                    checked={selectedSectors.includes(sector.id)}
                    onCheckedChange={(checked) =>
                      handleSectorChange(sector.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={sector.id} className="text-sm">
                    {sector.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Funcionário"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}