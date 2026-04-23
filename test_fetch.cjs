const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('treatment_plans').select('*').limit(1);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success (treatment_plans):', data);
  }
}

test();
