const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  const response = await fetch(supabaseUrl + '/rest/v1/?apikey=' + supabaseKey);
  const swagger = await response.json();
  const table = swagger.definitions['treatment_plan_items'];
  console.log('Columns for treatment_plan_items:', table ? Object.keys(table.properties) : 'Table not found');
}
inspectSchema();
