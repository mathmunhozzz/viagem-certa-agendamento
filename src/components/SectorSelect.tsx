import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Sector {
  id: string;
  name: string;
}

interface SectorSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function SectorSelect({ value, onValueChange, placeholder = "Selecione um setor" }: SectorSelectProps) {
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

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sectors.map((sector) => (
          <SelectItem key={sector.id} value={sector.id}>
            {sector.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}