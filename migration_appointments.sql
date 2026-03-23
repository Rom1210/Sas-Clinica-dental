-- =========================================================
-- MIGRATION: Asegura que la tabla appointments tenga los
-- campos correctos para starts_at / ends_at
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- 1. Añade starts_at si no existe
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

-- 2. Añade ends_at si no existe  
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- 3. Añade status si no existe
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- 4. Añade notes si no existe
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Fuerza el reload del schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificación: muestra las columnas actuales de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
