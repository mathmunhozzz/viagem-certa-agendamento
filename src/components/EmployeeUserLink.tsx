import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, Unlink, Search } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email?: string;
  position?: string;
  auth_user_id?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
}

export function EmployeeUserLink() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  const linkEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, userId }: { employeeId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("employees")
        .update({ auth_user_id: userId })
        .eq("id", employeeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário vinculado com sucesso!");
      setSelectedEmployee("");
      setSelectedUser("");
    },
    onError: (error) => {
      console.error("Erro ao vincular funcionário:", error);
      toast.error("Erro ao vincular funcionário");
    },
  });

  const unlinkEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await supabase
        .from("employees")
        .update({ auth_user_id: null })
        .eq("id", employeeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Vínculo removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao desvincular funcionário:", error);
      toast.error("Erro ao desvincular funcionário");
    },
  });

  const handleLink = async () => {
    if (!selectedEmployee || !selectedUser) {
      toast.error("Selecione um funcionário e um usuário");
      return;
    }

    setIsSubmitting(true);
    try {
      await linkEmployeeMutation.mutateAsync({
        employeeId: selectedEmployee,
        userId: selectedUser,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (employeeId: string) => {
    if (window.confirm("Tem certeza que deseja desvincular este funcionário?")) {
      await unlinkEmployeeMutation.mutateAsync(employeeId);
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedEmployees = filteredEmployees.filter((emp) => emp.auth_user_id);
  const unlinkedEmployees = filteredEmployees.filter((emp) => !emp.auth_user_id);

  const availableProfiles = profiles.filter((profile) => 
    !employees.some((emp) => emp.auth_user_id === profile.user_id)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vincular Funcionário ao Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.name}</span>
                        {employee.email && (
                          <span className="text-xs text-muted-foreground">
                            {employee.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.user_id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleLink}
            disabled={!selectedEmployee || !selectedUser || isSubmitting}
            className="w-full"
          >
            <Link className="h-4 w-4 mr-2" />
            {isSubmitting ? "Vinculando..." : "Vincular"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-green-600">
              Funcionários Vinculados ({linkedEmployees.length})
            </h3>
            <div className="space-y-2">
              {linkedEmployees.map((employee) => {
                const linkedProfile = profiles.find(
                  (p) => p.user_id === employee.auth_user_id
                );
                return (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{employee.name}</div>
                          {employee.email && (
                            <div className="text-sm text-muted-foreground">
                              {employee.email}
                            </div>
                          )}
                          {linkedProfile && (
                            <div className="text-sm text-green-600">
                              → {linkedProfile.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Vinculado
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlink(employee.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {linkedEmployees.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum funcionário vinculado
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-orange-600">
              Funcionários Não Vinculados ({unlinkedEmployees.length})
            </h3>
            <div className="space-y-2">
              {unlinkedEmployees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{employee.name}</div>
                        {employee.email && (
                          <div className="text-sm text-muted-foreground">
                            {employee.email}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        Não Vinculado
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {unlinkedEmployees.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Todos os funcionários estão vinculados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}