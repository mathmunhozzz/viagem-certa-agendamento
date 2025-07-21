import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Sector {
  id: string;
  name: string;
}

interface SectorMultiSelectProps {
  selectedSectors: string[];
  onSectorToggle: (sectorId: string, checked: boolean) => void;
}

export function SectorMultiSelect({ selectedSectors, onSectorToggle }: SectorMultiSelectProps) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectors();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Setores *</Label>
        <div className="text-sm text-muted-foreground">Carregando setores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Setores * (selecione um ou mais)</Label>
        {selectedSectors.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedSectors.length} selecionado{selectedSectors.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/20">
        {sectors.map((sector) => (
          <div key={sector.id} className="flex items-center space-x-2">
            <Checkbox
              id={sector.id}
              checked={selectedSectors.includes(sector.id)}
              onCheckedChange={(checked) =>
                onSectorToggle(sector.id, checked as boolean)
              }
            />
            <Label htmlFor={sector.id} className="text-sm cursor-pointer">
              {sector.name}
            </Label>
          </div>
        ))}
      </div>
      
      {sectors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum setor cadastrado. Cadastre setores primeiro.
        </p>
      )}
    </div>
  );
}