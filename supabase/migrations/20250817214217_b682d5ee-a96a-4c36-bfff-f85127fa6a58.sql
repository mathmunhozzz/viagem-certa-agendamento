-- Adicionar campo de observação para ausências
ALTER TABLE employee_absences 
ADD COLUMN admin_observation text;

-- Atualizar a trigger para incluir o novo campo
DROP TRIGGER IF EXISTS update_employee_absences_updated_at ON employee_absences;
CREATE TRIGGER update_employee_absences_updated_at
  BEFORE UPDATE ON employee_absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();