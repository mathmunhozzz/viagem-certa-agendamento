import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Search, Building2 } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface SectorListProps {
  refreshKey: number;
}

export function SectorList({ refreshKey }: SectorListProps) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchSectors = async () => {
    try {
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("name");

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, [refreshKey]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o setor "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("sectors").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso!",
      });

      fetchSectors();
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir setor. Verifique se não há funcionários associados.",
        variant: "destructive",
      });
    }
  };

  const filteredSectors = sectors.filter((sector) =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando setores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Setores Cadastrados
        </CardTitle>
        <CardDescription>
          Lista de todos os setores da empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar setores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {filteredSectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum setor encontrado" : "Nenhum setor cadastrado"}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{sector.name}</h3>
                    {sector.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {sector.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Criado em: {new Date(sector.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sector.id, sector.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}