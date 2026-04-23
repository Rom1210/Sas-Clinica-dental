const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testItemsFallback() {
  const { data, error } = await supabase.from('treatment_plan_items').insert([{
    plan_id: '12345678-1234-1234-1234-123456789012',
    name: 'Test Treatment',
    quantity: 1,
    unit_price: 100,
    is_completed: false
  }]);

  console.log('Error:', error);
}

testItemsFallback();
