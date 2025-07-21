import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
}

interface EmployeeMultiSelectProps {
  selectedSectors: string[];
  selectedEmployees: string[];
  onEmployeeToggle: (employeeId: string, checked: boolean) => void;
}

export function EmployeeMultiSelect({ 
  selectedSectors, 
  selectedEmployees, 
  onEmployeeToggle 
}: EmployeeMultiSelectProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (selectedSectors.length === 0) {
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Buscar funcionários dos setores selecionados
        const { data, error } = await supabase
          .from("employee_sectors")
          .select(`
            employee_id,
            employees (
              id,
              name,
              email,
              position
            )
          `)
          .in('sector_id', selectedSectors);

        if (error) throw error;

        // Extrair funcionários únicos
        const uniqueEmployees = new Map<string, Employee>();
        data?.forEach((item: any) => {
          if (item.employees) {
            uniqueEmployees.set(item.employees.id, item.employees);
          }
        });

        setEmployees(Array.from(uniqueEmployees.values()));
      } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [selectedSectors]);

  if (selectedSectors.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Funcionários</Label>
        <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border">
          Selecione pelo menos um setor para ver os funcionários disponíveis
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Funcionários</Label>
        <div className="text-sm text-muted-foreground">Carregando funcionários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Funcionários dos setores selecionados</Label>
        {selectedEmployees.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedEmployees.length} selecionado{selectedEmployees.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border">
          Nenhum funcionário encontrado nos setores selecionados
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/20">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-start space-x-2 p-2 rounded border bg-background/50">
              <Checkbox
                id={employee.id}
                checked={selectedEmployees.includes(employee.id)}
                onCheckedChange={(checked) =>
                  onEmployeeToggle(employee.id, checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={employee.id} className="text-sm font-medium cursor-pointer block">
                  {employee.name}
                </Label>
                {employee.position && (
                  <p className="text-xs text-muted-foreground">{employee.position}</p>
                )}
                {employee.email && (
                  <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}