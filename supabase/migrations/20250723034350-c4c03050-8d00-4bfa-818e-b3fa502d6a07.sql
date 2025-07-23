-- Criar tabela para configurações de notificação
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email_reminders BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela para log de notificações enviadas
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) NOT NULL,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent',
  error_message TEXT
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_settings
CREATE POLICY "Users can view their own notification settings" 
  ON public.notification_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
  ON public.notification_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
  ON public.notification_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para notification_logs (apenas admins e managers podem ver)
CREATE POLICY "Admins and managers can view notification logs" 
  ON public.notification_logs 
  FOR SELECT 
  USING (has_role('admin'::app_role) OR has_role('manager'::app_role));

CREATE POLICY "System can insert notification logs" 
  ON public.notification_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Criar view otimizada para gráficos do dashboard
CREATE OR REPLACE VIEW public.trip_statistics AS
SELECT 
  DATE_TRUNC('month', trip_date) as month,
  COUNT(*) as total_trips,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_trips,
  ARRAY_AGG(DISTINCT sector) as sectors,
  ARRAY_AGG(DISTINCT vehicle_id) FILTER (WHERE vehicle_id IS NOT NULL) as vehicles_used
FROM public.trips
WHERE trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', trip_date)
ORDER BY month;

-- Criar view para estatísticas por setor
CREATE OR REPLACE VIEW public.sector_statistics AS
SELECT 
  s.name as sector_name,
  COUNT(t.id) as trip_count,
  COUNT(DISTINCT t.employee_ids) as employee_count,
  AVG(ARRAY_LENGTH(t.travelers, 1)) as avg_travelers
FROM public.sectors s
LEFT JOIN public.trips t ON t.sector = s.name
WHERE t.trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY s.name, s.id
ORDER BY trip_count DESC;

-- Criar view para estatísticas de veículos
CREATE OR REPLACE VIEW public.vehicle_statistics AS
SELECT 
  v.brand || ' ' || v.model as vehicle_name,
  v.plate,
  v.capacity,
  COUNT(t.id) as trip_count,
  ROUND(COUNT(t.id) * 100.0 / NULLIF(
    (SELECT COUNT(*) FROM public.trips WHERE vehicle_id IS NOT NULL), 0
  ), 2) as usage_percentage
FROM public.vehicles v
LEFT JOIN public.trips t ON t.vehicle_id = v.id
WHERE t.trip_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY v.id, v.brand, v.model, v.plate, v.capacity
ORDER BY trip_count DESC;

-- Trigger para atualizar updated_at em notification_settings
CREATE OR REPLACE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();