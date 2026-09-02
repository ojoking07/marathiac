CREATE TABLE public.test_settings (
  id boolean PRIMARY KEY DEFAULT true,
  question_count integer NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 1 AND 30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT test_settings_singleton CHECK (id)
);

GRANT SELECT ON public.test_settings TO authenticated;
GRANT SELECT ON public.test_settings TO anon;
GRANT ALL ON public.test_settings TO service_role;

ALTER TABLE public.test_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test settings"
  ON public.test_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update test settings"
  ON public.test_settings FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

GRANT UPDATE ON public.test_settings TO authenticated;

CREATE TRIGGER update_test_settings_updated_at
  BEFORE UPDATE ON public.test_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.test_settings (id, question_count) VALUES (true, 10);