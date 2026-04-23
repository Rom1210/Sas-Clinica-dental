const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';

async function fetchSchema() {
  const response = await fetch(supabaseUrl + '/rest/v1/?apikey=' + supabaseKey);
  const swagger = await response.json();
  const defs = swagger.definitions || swagger.components?.schemas;
  if (!defs) {
    console.log("No schemas found");
    return;
  }
  const table = defs['treatment_plan_items'];
  console.log('treatment_plan_items:', table);
}
fetchSchema();
