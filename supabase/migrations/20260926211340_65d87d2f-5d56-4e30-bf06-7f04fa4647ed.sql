CREATE TABLE public.api_budget_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name text NOT NULL UNIQUE,
  monthly_limit_usd numeric NOT NULL DEFAULT 50,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.api_budget_limits TO authenticated;
GRANT ALL ON public.api_budget_limits TO service_role;

ALTER TABLE public.api_budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read budget limits" ON public.api_budget_limits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update budget limits" ON public.api_budget_limits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_api_budget_limits_updated_at
  BEFORE UPDATE ON public.api_budget_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.api_budget_limits (api_name, monthly_limit_usd, enabled)
VALUES ('google_places', 50, true);

-- Hilfsfunktion: aktuelle Monatskosten einer API (für Budget-Checks in Edge Functions)
CREATE OR REPLACE FUNCTION public.get_api_monthly_spend(_api_name text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(estimated_cost), 0)
  FROM public.api_usage_logs
  WHERE api_name = _api_name
    AND created_at >= date_trunc('month', now());
$$;