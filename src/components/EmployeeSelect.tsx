import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
}

interface EmployeeSelectProps {
  sectorId?: string;
  selectedEmployees: string[];
  onEmployeeToggle: (employeeId: string, checked: boolean) => void;
}

export function EmployeeSelect({ sectorId, selectedEmployees, onEmployeeToggle }: EmployeeSelectProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!sectorId) {
        setEmployees([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select(`
            id,
            name,
            email,
            position,
            employee_sectors!inner (
              sector_id
            )
          `)
          .eq("employee_sectors.sector_id", sectorId)
          .order("name");

        if (error) throw error;

        // Remover duplicatas (funcionário pode aparecer múltiplas vezes se tiver múltiplos setores)
        const uniqueEmployees = data?.reduce((acc: Employee[], current: any) => {
          if (!acc.find(emp => emp.id === current.id)) {
            acc.push({
              id: current.id,
              name: current.name,
              email: current.email,
              position: current.position,
            });
          }
          return acc;
        }, []) || [];

        setEmployees(uniqueEmployees);
      } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [sectorId]);

  if (!sectorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Funcionários
          </CardTitle>
          <CardDescription>
            Primeiro selecione um setor para ver os funcionários disponíveis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando funcionários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Selecionar Funcionários
        </CardTitle>
        <CardDescription>
          Escolha os funcionários que participarão da viagem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum funcionário encontrado neste setor
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                <Checkbox
                  id={employee.id}
                  checked={selectedEmployees.includes(employee.id)}
                  onCheckedChange={(checked) =>
                    onEmployeeToggle(employee.id, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor={employee.id} className="cursor-pointer">
                    <div className="font-medium">{employee.name}</div>
                    {employee.position && (
                      <div className="text-sm text-muted-foreground">
                        {employee.position}
                      </div>
                    )}
                    {employee.email && (
                      <div className="text-xs text-muted-foreground">
                        {employee.email}
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            ))}
            
            {selectedEmployees.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Selecionados:</span>
                  <Badge variant="secondary">
                    {selectedEmployees.length} funcionário{selectedEmployees.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}