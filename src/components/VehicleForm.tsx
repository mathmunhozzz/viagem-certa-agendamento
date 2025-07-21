import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const vehicleSchema = z.object({
  brand: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  plate: z.string().min(7, "Placa deve ter pelo menos 7 caracteres"),
  year: z.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1),
  capacity: z.number().min(1, "Capacidade deve ser pelo menos 1").max(50),
  status: z.enum(["available", "unavailable", "maintenance"]),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onVehicleCreated?: () => void;
  vehicle?: any;
  onVehicleUpdated?: () => void;
  onCancel?: () => void;
}

export function VehicleForm({ onVehicleCreated, vehicle, onVehicleUpdated, onCancel }: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!vehicle;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle ? {
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      year: vehicle.year,
      capacity: vehicle.capacity,
      status: vehicle.status,
    } : {
      status: "available",
      capacity: 5,
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    
    try {
      if (isEditing) {
        const { error } = await supabase
          .from("vehicles")
          .update(data)
          .eq("id", vehicle.id);

        if (error) throw error;
        
        toast.success("Veículo atualizado com sucesso!");
        onVehicleUpdated?.();
      } else {
        const vehicleData = {
          brand: data.brand,
          model: data.model,
          plate: data.plate,
          year: data.year,
          capacity: data.capacity,
          status: data.status
        };
        
        const { error } = await supabase
          .from("vehicles")
          .insert([vehicleData]);

        if (error) throw error;
        
        toast.success("Veículo cadastrado com sucesso!");
        reset();
        onVehicleCreated?.();
      }
    } catch (error: any) {
      console.error("Erro ao salvar veículo:", error);
      toast.error(error.message || "Erro ao salvar veículo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Veículo" : "Cadastrar Novo Veículo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                {...register("brand")}
                placeholder="Ex: Toyota, Ford, Volkswagen"
              />
              {errors.brand && (
                <p className="text-sm text-destructive mt-1">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                {...register("model")}
                placeholder="Ex: Corolla, Fiesta, Gol"
              />
              {errors.model && (
                <p className="text-sm text-destructive mt-1">{errors.model.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                {...register("plate")}
                placeholder="ABC-1234"
                className="uppercase"
              />
              {errors.plate && (
                <p className="text-sm text-destructive mt-1">{errors.plate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                {...register("year", { valueAsNumber: true })}
                placeholder="2020"
              />
              {errors.year && (
                <p className="text-sm text-destructive mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="capacity">Capacidade (passageiros)</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="5"
              />
              {errors.capacity && (
                <p className="text-sm text-destructive mt-1">{errors.capacity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {isEditing && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}