-- ==============================================================================
-- Migration 001: Table profiles & RLS (Extension auth.users)
-- ==============================================================================

-- 1. Create table public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_subscribed boolean NOT NULL DEFAULT false,
  subscription_ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(is_subscribed, subscription_ends_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update non-critical profile fields (cannot escalate is_subscribed)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Security Hardening: Revoke client direct update permissions on subscription status
-- Only the service_role (Edge Functions / Webhook) can alter subscription state
REVOKE UPDATE (is_subscribed, subscription_ends_at) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_subscribed, subscription_ends_at) ON public.profiles FROM anon;

-- 5. Trigger to automatically provision profile with 30-day Pro license on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_subscribed, subscription_ends_at, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    true,
    now() + interval '30 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET is_subscribed = true,
      subscription_ends_at = now() + interval '30 days',
      email = EXCLUDED.email,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill all existing users with 30-day Pro license
INSERT INTO public.profiles (id, email, is_subscribed, subscription_ends_at, created_at, updated_at)
SELECT id, email, true, now() + interval '30 days', now(), now()
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET is_subscribed = true,
    subscription_ends_at = now() + interval '30 days',
    updated_at = now();
