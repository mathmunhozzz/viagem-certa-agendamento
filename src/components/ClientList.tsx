import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, Trash2, Search, MapPin, Phone } from "lucide-react";
import { EditClientDialog } from "./EditClientDialog";

interface Client {
  id: string;
  name: string;
  municipality?: string;
  contact?: string;
  created_at: string;
  updated_at: string;
}

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const queryClient = useQueryClient();

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

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    },
  });

  const handleDelete = async (clientId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteClientMutation.mutateAsync(clientId);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.municipality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando clientes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Total: {filteredClients.length} cliente(s)
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-3">
                    <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground">
                      {client.name}
                    </h3>
                    {client.municipality && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{client.municipality}</span>
                      </div>
                    )}
                    {client.contact && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Phone className="h-3 w-3" />
                        <span className="break-words">{client.contact}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Cliente
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingClient(client)}
                    className="w-full flex items-center justify-center gap-2 h-10"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    className="w-full flex items-center justify-center gap-2 h-10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}
    </div>
  );
}