-- SmartDental OS - Database Schema (Draft Superior)

-- Extensions for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
DO $$ BEGIN
    CREATE TYPE patient_status AS ENUM ('Activo', 'Inactivo', 'En Seguimiento');
    CREATE TYPE treatment_plan_status AS ENUM ('borrador', 'aprobado', 'rechazado', 'finalizado');
    CREATE TYPE payment_currency AS ENUM ('USD', 'VES');
    CREATE TYPE gender_type AS ENUM ('M', 'F', 'Otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL,
    whatsapp TEXT,
    email TEXT,
    birth_date DATE,
    gender gender_type,
    status patient_status DEFAULT 'Activo',
    medical_flags JSONB DEFAULT '[]'::jsonb, -- Alergias, Hipertensión, etc.
    habits JSONB DEFAULT '{"fuma": false, "bruxismo": false}'::jsonb,
    metadata_n8n JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT,
    schedule JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true
);

-- 3. Services Catalog
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    category TEXT
);

-- 4. Consultation Management
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    evolution TEXT,
    procedures JSONB DEFAULT '[]'::jsonb, -- Array of service IDs or objects
    vitals JSONB DEFAULT '{}'::jsonb, -- Pressure, etc.
    amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    name_plan TEXT NOT NULL,
    status treatment_plan_status DEFAULT 'borrador',
    total_estimated DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Items per Plan (Phased)
CREATE TABLE IF NOT EXISTS plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES treatment_plans(id),
    service_id UUID REFERENCES services(id),
    tooth_id TEXT, -- e.g., '16'
    unit_cost DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    phase TEXT DEFAULT 'Fase 1',
    completed BOOLEAN DEFAULT false
);

-- 7. Financial Management (Payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    plan_id UUID REFERENCES treatment_plans(id),
    consultation_id UUID REFERENCES consultations(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency payment_currency DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4),
    payment_method TEXT,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Odontogram States
CREATE TABLE IF NOT EXISTS odontogram (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    tooth_id TEXT NOT NULL,
    surface TEXT NOT NULL, -- Vestibular, Palatina, etc.
    state TEXT NOT NULL, -- Caries, Tratado, Ausente
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Global Configuration
CREATE TABLE IF NOT EXISTS configuration (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize Configuration
INSERT INTO configuration (key, value) VALUES ('exchange_rate', '{"usd_to_ves": 36.50}'::jsonb) 
ON CONFLICT (key) DO NOTHING;
