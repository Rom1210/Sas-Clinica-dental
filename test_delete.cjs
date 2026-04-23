const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
  // 1. Fetch a plan ID
  const { data: plans } = await supabase.from('treatment_plans').select('id, name').limit(1);
  if (!plans || plans.length === 0) {
    console.log("No plans found.");
    return;
  }
  const planId = plans[0].id;
  console.log("Attempting to delete plan:", plans[0].name, planId);

  // 2. Try to delete it
  const { error } = await supabase.from('treatment_plans').delete().eq('id', planId);
  if (error) {
    console.error("Delete Error:", error);
  } else {
    console.log("Successfully deleted plan!");
  }
}

testDelete();
