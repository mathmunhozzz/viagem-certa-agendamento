import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Search, Users, Mail, Briefcase } from "lucide-react";
import { SectorSelect } from "./SectorSelect";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  created_at: string;
  sectors: Array<{
    id: string;
    name: string;
  }>;
}

interface EmployeeListProps {
  refreshKey: number;
}

export function EmployeeList({ refreshKey }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          email,
          position,
          created_at,
          employee_sectors!inner (
            sectors (
              id,
              name
            )
          )
        `)
        .order("name");

      if (error) throw error;

      // Transformar os dados para agrupar setores por funcionário
      const employeesMap = new Map<string, Employee>();
      
      data?.forEach((item: any) => {
        const employeeId = item.id;
        if (!employeesMap.has(employeeId)) {
          employeesMap.set(employeeId, {
            id: item.id,
            name: item.name,
            email: item.email,
            position: item.position,
            created_at: item.created_at,
            sectors: []
          });
        }
        
        const employee = employeesMap.get(employeeId)!;
        item.employee_sectors.forEach((es: any) => {
          if (es.sectors && !employee.sectors.find(s => s.id === es.sectors.id)) {
            employee.sectors.push(es.sectors);
          }
        });
      });

      setEmployees(Array.from(employeesMap.values()));
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refreshKey]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
      });

      fetchEmployees();
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário. Verifique se não há viagens agendadas.",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = !sectorFilter || employee.sectors.some(s => s.id === sectorFilter);
    
    return matchesSearch && matchesSector;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando funcionários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Funcionários Cadastrados
        </CardTitle>
        <CardDescription>
          Lista de todos os funcionários da empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="min-w-[200px]">
              <SectorSelect
                value={sectorFilter}
                onValueChange={setSectorFilter}
                placeholder="Filtrar por setor"
              />
            </div>
            {sectorFilter && (
              <Button
                variant="outline"
                onClick={() => setSectorFilter("")}
              >
                Limpar
              </Button>
            )}
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || sectorFilter ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{employee.name}</h3>
                    
                    {employee.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </div>
                    )}
                    
                    {employee.position && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Briefcase className="h-3 w-3" />
                        {employee.position}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {employee.sectors.map((sector) => (
                        <Badge key={sector.id} variant="secondary">
                          {sector.name}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Criado em: {new Date(employee.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(employee.id, employee.name)}
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