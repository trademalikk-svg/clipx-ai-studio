-- Hardening and query-plan improvements applied to ClipX production.
ALTER POLICY "Users create own clip jobs"
  ON public.clip_jobs
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users read own clip jobs"
  ON public.clip_jobs
  USING ((select auth.uid()) = user_id);

ALTER POLICY profile_insert_own
  ON public.profiles
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY profile_select_own
  ON public.profiles
  USING ((select auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.set_clip_job_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
