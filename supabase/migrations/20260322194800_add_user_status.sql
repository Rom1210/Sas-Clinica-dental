-- Add status column to organization_users
ALTER TABLE public.organization_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure existing users are 'active'
UPDATE public.organization_users SET status = 'active' WHERE status IS NULL;
