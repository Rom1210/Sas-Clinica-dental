const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';

async function inspectSchema() {
  const response = await fetch(supabaseUrl + '/rest/v1/?apikey=' + supabaseKey);
  const swagger = await response.json();
  const tableDef = swagger.definitions['treatment_plan_items'];
  console.log(swagger.definitions ? Object.keys(swagger.definitions) : 'No definitions');
  if (swagger.definitions && swagger.definitions['treatment_plan_items']) {
    console.log(swagger.definitions['treatment_plan_items'].properties);
  }
}
inspectSchema();
