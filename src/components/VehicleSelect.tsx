import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  capacity: number;
  status: "available" | "unavailable" | "maintenance";
}

interface VehicleSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  tripDate?: string;
  excludeTripId?: string;
  error?: string;
}

export function VehicleSelect({ value, onValueChange, tripDate, excludeTripId, error }: VehicleSelectProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [unavailableVehicles, setUnavailableVehicles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    if (tripDate) {
      checkVehicleAvailability();
    }
  }, [tripDate]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "available")
        .order("brand", { ascending: true });

      if (error) throw error;
      setVehicles((data || []) as Vehicle[]);
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVehicleAvailability = async () => {
    if (!tripDate) return;

    try {
      let query = supabase
        .from("trips")
        .select("vehicle_id")
        .eq("trip_date", tripDate)
        .not("vehicle_id", "is", null);

      // Excluir a viagem atual ao editar
      if (excludeTripId) {
        query = query.neq("id", excludeTripId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const unavailable = data?.map(trip => trip.vehicle_id).filter(Boolean) || [];
      setUnavailableVehicles(unavailable);
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
    }
  };

  const isVehicleAvailable = (vehicleId: string) => {
    return !unavailableVehicles.includes(vehicleId);
  };

  const selectedVehicle = vehicles.find(v => v.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="vehicle">Veículo</Label>
      <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={isLoading ? "Carregando veículos..." : "Selecione um veículo"}>
            {selectedVehicle && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>{selectedVehicle.brand} {selectedVehicle.model}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedVehicle.plate}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {vehicles.length === 0 ? (
            <div className="px-2 py-4 text-center text-muted-foreground">
              Nenhum veículo disponível
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const available = isVehicleAvailable(vehicle.id);
              return (
                <SelectItem 
                  key={vehicle.id} 
                  value={vehicle.id}
                  disabled={!available}
                  className={!available ? "opacity-50" : ""}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <div>
                        <div className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle.plate} • {vehicle.capacity} passageiros
                        </div>
                      </div>
                    </div>
                    {!available && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Indisponível
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {tripDate && selectedVehicle && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Veículo Selecionado:</div>
            <div className="text-muted-foreground">
              {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.plate}
            </div>
            <div className="text-muted-foreground">
              Capacidade: {selectedVehicle.capacity} passageiros
            </div>
          </div>
        </div>
      )}
    </div>
  );
}