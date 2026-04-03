-- Añadiendo campos de estado y motivo a las citas
ALTER TABLE public.appointments
ADD COLUMN status text DEFAULT 'scheduled'::text NOT NULL,
ADD COLUMN status_reason text;

-- Asegurar compatibilidad para futuras inserciones
COMMENT ON COLUMN public.appointments.status IS 'Can be: scheduled, completed, rescheduled, cancelled';
COMMENT ON COLUMN public.appointments.status_reason IS 'Reason for reschedule or cancellation';
