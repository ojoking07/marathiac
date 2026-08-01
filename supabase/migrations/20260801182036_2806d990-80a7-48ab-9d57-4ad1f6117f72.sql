-- 1) Prevent clients from forging test scores: only the server (service role) may write attempts.
REVOKE INSERT, UPDATE, DELETE ON public.test_attempts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.test_attempts FROM anon;
GRANT SELECT ON public.test_attempts TO authenticated;
GRANT ALL ON public.test_attempts TO service_role;

DROP POLICY IF EXISTS "Users manage own tests" ON public.test_attempts;
CREATE POLICY "Users can view own tests"
  ON public.test_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) Trigger-only SECURITY DEFINER / helper functions must not be callable via the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;