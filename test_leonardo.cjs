const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, full_name, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching patients:', error);
    return;
  }

  console.log('Found Leonardo patients:', patients);
}

inspect();
