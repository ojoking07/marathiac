CREATE POLICY "Admins can view all tests"
ON public.test_attempts
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));