-- 1. Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'elite', 'trial')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  voice_minutes_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Habilitar RLS en Suscripciones
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver suscripción propia" ON subscriptions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = subscriptions.organization_id
  ));

CREATE POLICY "Actualizar suscripción propia (admin)" ON subscriptions
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = subscriptions.organization_id AND role = 'admin'
  ));

CREATE POLICY "Crear suscripción propia" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = subscriptions.organization_id
  ));


-- 2. Tabla de Solicitudes de Pago (Pago Manual)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  minutes INTEGER, -- Si es pago por minutos en vez de un plan
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en Solicitudes de Pago
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver pagos propios" ON payment_requests
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = payment_requests.organization_id
  ));

CREATE POLICY "Crear pagos propios" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = payment_requests.organization_id
  ));

CREATE POLICY "Actualizar (admin aprueba/rechaza)" ON payment_requests
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM users WHERE organization_id = payment_requests.organization_id AND role = 'admin'
  ));


-- 3. Crear Storage Bucket para los comprobantes
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Cualquiera puede ver comprobantes" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Usuarios autenticados pueden subir comprobantes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
