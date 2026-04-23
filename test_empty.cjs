const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmptyInsert() {
  const { data, error } = await supabase.from('treatment_plan_items').insert([{}]);
  console.log('Error:', error);
}
testEmptyInsert();
