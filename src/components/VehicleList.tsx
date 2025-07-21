import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleForm } from "./VehicleForm";
import { toast } from "sonner";
import { Edit, Trash2, Car, Search, Filter } from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  capacity: number;
  status: "available" | "unavailable" | "maintenance";
  created_at: string;
  updated_at: string;
}

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles((data || []) as Vehicle[]);
    } catch (error: any) {
      console.error("Erro ao buscar veículos:", error);
      toast.error("Erro ao carregar veículos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Veículo excluído com sucesso!");
      fetchVehicles();
    } catch (error: any) {
      console.error("Erro ao excluir veículo:", error);
      toast.error("Erro ao excluir veículo");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Disponível", variant: "default" as const },
      unavailable: { label: "Indisponível", variant: "secondary" as const },
      maintenance: { label: "Manutenção", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = 
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (editingVehicle) {
    return (
      <VehicleForm
        vehicle={editingVehicle}
        onVehicleUpdated={() => {
          setEditingVehicle(null);
          fetchVehicles();
        }}
        onCancel={() => setEditingVehicle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Veículos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando veículos...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {vehicles.length === 0 
                ? "Nenhum veículo cadastrado ainda."
                : "Nenhum veículo encontrado com os filtros aplicados."
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-muted-foreground text-sm">{vehicle.plate}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(vehicle.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex justify-between">
                        <span>Ano:</span>
                        <span className="font-medium">{vehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacidade:</span>
                        <span className="font-medium">{vehicle.capacity} passageiros</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingVehicle(vehicle)}
                        className="flex items-center justify-center gap-2 h-9 flex-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex items-center justify-center gap-2 h-9 flex-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm">Excluir</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}