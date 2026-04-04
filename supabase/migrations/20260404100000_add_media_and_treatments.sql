-- 20260404100000_add_media_and_treatments.sql
-- Run this in your Supabase SQL Editor

-- Create patient_media table
CREATE TABLE IF NOT EXISTS public.patient_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'x-ray', -- x-ray, photo, exam
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create treatment_plans table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create treatment_plan_items table
CREATE TABLE IF NOT EXISTS public.treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Policies (assuming organization_id based auth)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their org media') THEN
        CREATE POLICY "Users can see their org media" ON public.patient_media FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their org plans') THEN
        CREATE POLICY "Users can see their org plans" ON public.treatment_plans FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their org plan items') THEN
        CREATE POLICY "Users can see their org plan items" ON public.treatment_plan_items FOR ALL USING (true);
    END IF;
END $$;
