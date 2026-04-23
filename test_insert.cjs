const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('treatment_plans').insert([{
    patient_id: '123e4567-e89b-12d3-a456-426614174000',
    organization_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Plan',
    total_amount: 100,
    notes: 'Testing',
    status: 'pending'
  }]);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
