-- Only the trusted Edge Function may create clip_jobs rows.
-- The browser must not be able to insert arbitrary job states or source paths.
DROP POLICY IF EXISTS "Users create own clip jobs" ON public.clip_jobs;
