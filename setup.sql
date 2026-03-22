-- =========================================================
-- INITIAL SETUP SCRIPT FOR SMARTDENTAL OS
-- =========================================================
-- Run this in your Supabase SQL Editor.
-- This script prepares the first organization and sets up the 
-- relationship for the initial admin user.

-- 1. Create the Main Organization
INSERT INTO public.organizations (name, slug, status, settings)
VALUES ('SmartDental Principal', 'smart-dental-main', 'active', '{"plan": "enterprise"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. IMPORTANT: CREATING THE AUTH USER
-- SQL cannot easily set a password for Supabase Auth Users directly.
-- Please go to the Supabase Dashboard -> Authentication -> Users -> "Add user"
-- and create: Khouryromero@gmail.com with password Fab12
-- AFTER creating the user, run the following to link it to the organization.

/* 
-- REPLACE 'USER_ID_FROM_AUTH' with the ID you get from the Auth tab.
DO $$
DECLARE
    org_id uuid;
    new_user_id uuid := 'USER_ID_FROM_AUTH'; -- PASTE THE UUID HERE
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'smart-dental-main';

    -- Create Profile
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (new_user_id, 'Admin Khoury', 'Khouryromero@gmail.com', 'owner')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Admin Khoury';

    -- Assign to Organization as Owner
    INSERT INTO public.organization_users (organization_id, user_id, role, is_active)
    VALUES (org_id, new_user_id, 'owner', true)
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Setup completed for user Khouryromero@gmail.com';
END $$;
*/
