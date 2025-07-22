import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  municipality?: string;
  contact?: string;
}

interface ClientSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function ClientSelect({
  value,
  onValueChange,
  placeholder = "Selecione um cliente",
  required = false,
}: ClientSelectProps) {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Client[];
    },
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando clientes..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            <div className="flex flex-col">
              <span className="font-medium">{client.name}</span>
              {client.municipality && (
                <span className="text-xs text-muted-foreground">
                  {client.municipality}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}