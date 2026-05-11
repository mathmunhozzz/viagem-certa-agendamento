import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EmployeeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  onSaved: () => void;
}

interface Sector {
  id: string;
  name: string;
}

export function EmployeeEditDialog({ open, onOpenChange, employeeId, onSaved }: EmployeeEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !employeeId) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: emp }, { data: secs }, { data: empSecs }] = await Promise.all([
          supabase.from("employees").select("name, email, position").eq("id", employeeId).maybeSingle(),
          supabase.from("sectors").select("id, name").order("name"),
          supabase.from("employee_sectors").select("sector_id").eq("employee_id", employeeId),
        ]);
        setName(emp?.name ?? "");
        setEmail(emp?.email ?? "");
        setPosition(emp?.position ?? "");
        setSectors(secs || []);
        setSelectedSectors((empSecs || []).map((s: any) => s.sector_id));
      } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, employeeId, toast]);

  const toggleSector = (id: string, checked: boolean) => {
    setSelectedSectors((prev) => checked ? [...prev, id] : prev.filter((s) => s !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (selectedSectors.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um setor", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from("employees")
        .update({
          name: name.trim(),
          email: email.trim() || null,
          position: position.trim() || null,
        })
        .eq("id", employeeId);
      if (updateErr) throw updateErr;

      // Replace sectors
      const { error: delErr } = await supabase
        .from("employee_sectors")
        .delete()
        .eq("employee_id", employeeId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("employee_sectors")
        .insert(selectedSectors.map((sid) => ({ employee_id: employeeId, sector_id: sid })));
      if (insErr) throw insErr;

      toast({ title: "Sucesso", description: "Funcionário atualizado" });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao salvar alterações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription>Atualize os dados e setores do funcionário.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Cargo</Label>
              <Input id="edit-position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Setores *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {sectors.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-sec-${s.id}`}
                      checked={selectedSectors.includes(s.id)}
                      onCheckedChange={(c) => toggleSector(s.id, c as boolean)}
                    />
                    <Label htmlFor={`edit-sec-${s.id}`} className="text-sm">{s.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
