-- Admin metrics: allowlist for /admin og første checkout-tidspunkt for pulse-KPI.

CREATE TABLE IF NOT EXISTS public.admin_viewer (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_viewer_email_normalized CHECK (email = lower(trim(email)))
);

ALTER TABLE public.admin_viewer ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_viewer FROM PUBLIC;

COMMENT ON TABLE public.admin_viewer IS
  'Intern tilgang til /admin. Legg inn normalisert e-post: INSERT INTO admin_viewer (email) VALUES (''deg@example.com'');';

-- ---------------------------------------------------------------------------
-- Første fullførte checkout (webhook setter ved første stripe_subscription_id)
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_subscription
  ADD COLUMN IF NOT EXISTS first_checkout_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS user_subscription_first_checkout_at_idx
  ON public.user_subscription (first_checkout_at)
  WHERE first_checkout_at IS NOT NULL;

UPDATE public.user_subscription
SET first_checkout_at = updated_at
WHERE stripe_subscription_id IS NOT NULL
  AND first_checkout_at IS NULL;
