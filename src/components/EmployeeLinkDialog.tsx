import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Link, Unlink } from "lucide-react";
import { toast } from "sonner";

interface EmployeeLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onLinked: () => void;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
}

export function EmployeeLinkDialog({ open, onOpenChange, employeeId, employeeName, onLinked }: EmployeeLinkDialogProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employeesUserIds, setEmployeesUserIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [{ data: profilesData, error: pErr }, { data: employeesData, error: eErr }, { data: empData, error: empErr }] = await Promise.all([
          supabase.from("profiles").select("id, user_id, name").order("name"),
          supabase.from("employees").select("auth_user_id").not("auth_user_id", "is", null),
          supabase.from("employees").select("auth_user_id").eq("id", employeeId).maybeSingle(),
        ]);
        if (pErr) throw pErr;
        if (eErr) throw eErr;
        if (empErr) throw empErr;
        setProfiles(profilesData || []);
        setEmployeesUserIds((employeesData || []).map((e: any) => e.auth_user_id));
        setCurrentUserId(empData?.auth_user_id ?? null);
      } catch (error) {
        console.error("Erro ao carregar dados para vínculo:", error);
      }
    };
    fetchData();
  }, [open, employeeId]);

  const availableProfiles = useMemo(() => {
    return profiles.filter((p) => !employeesUserIds.includes(p.user_id) || p.user_id === currentUserId);
  }, [profiles, employeesUserIds, currentUserId]);

  const handleLink = async () => {
    if (!selectedUser) {
      toast.error("Selecione um usuário");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({ auth_user_id: selectedUser })
        .eq("id", employeeId);
      if (error) throw error;
      toast.success("Funcionário vinculado com sucesso!");
      onLinked();
      setSelectedUser("");
    } catch (error) {
      console.error("Erro ao vincular:", error);
      toast.error("Erro ao vincular funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Tem certeza que deseja desvincular este funcionário?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({ auth_user_id: null })
        .eq("id", employeeId);
      if (error) throw error;
      toast.success("Vínculo removido com sucesso!");
      onLinked();
    } catch (error) {
      console.error("Erro ao desvincular:", error);
      toast.error("Erro ao desvincular funcionário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Profissional</DialogTitle>
          <p className="text-sm text-muted-foreground">Funcionário: <span className="font-semibold">{employeeName}</span></p>
        </DialogHeader>

        {currentUserId ? (
          <div className="space-y-3">
            <p className="text-sm">Este funcionário já está vinculado a um usuário.</p>
            <Button variant="outline" onClick={handleUnlink} disabled={loading}>
              <Unlink className="h-4 w-4 mr-2" /> Desvincular
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
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
        )}

        <DialogFooter>
          {!currentUserId && (
            <Button onClick={handleLink} disabled={!selectedUser || loading}>
              <Link className="h-4 w-4 mr-2" /> Vincular
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
