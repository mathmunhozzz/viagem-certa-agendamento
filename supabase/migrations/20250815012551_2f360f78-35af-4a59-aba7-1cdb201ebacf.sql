-- Create credit_cards table
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  last_four_digits TEXT NOT NULL CHECK (length(last_four_digits) = 4 AND last_four_digits ~ '^[0-9]+$'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_cards
CREATE POLICY "Admins and managers can view all credit cards"
ON public.credit_cards
FOR SELECT
USING (has_role('admin'::app_role) OR has_role('manager'::app_role));

CREATE POLICY "Admins and managers can insert credit cards"
ON public.credit_cards
FOR INSERT
WITH CHECK (has_role('admin'::app_role) OR has_role('manager'::app_role));

CREATE POLICY "Admins and managers can update credit cards"
ON public.credit_cards
FOR UPDATE
USING (has_role('admin'::app_role) OR has_role('manager'::app_role));

CREATE POLICY "Admins and managers can delete credit cards"
ON public.credit_cards
FOR DELETE
USING (has_role('admin'::app_role) OR has_role('manager'::app_role));

-- Add credit_card_id to trips table (optional)
ALTER TABLE public.trips 
ADD COLUMN credit_card_id UUID REFERENCES public.credit_cards(id);

-- Add trigger for credit_cards updated_at
CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();