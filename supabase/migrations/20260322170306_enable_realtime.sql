-- Enable Real-time for core tables
alter publication supabase_realtime add table patients;
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table consultations;
alter publication supabase_realtime add table payments;
