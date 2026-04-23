const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectItems() {
  const { data, error } = await supabase.from('treatment_plan_items').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Data Structure for treatment_plan_items:', data);
  }
}
inspectItems();
