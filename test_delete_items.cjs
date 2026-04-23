const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteWithItems() {
  // 1. Fetch a plan ID that HAS items
  const { data: plans } = await supabase.from('treatment_plans').select('id, name, treatment_plan_items(id)').limit(5);
  
  const planWithItems = plans.find(p => p.treatment_plan_items.length > 0);
  
  if (!planWithItems) {
    console.log("No plans with items found to test delete.");
    return;
  }
  
  console.log("Attempting to delete plan with items:", planWithItems.name, planWithItems.id);

  // 2. Try to delete it
  const { error } = await supabase.from('treatment_plans').delete().eq('id', planWithItems.id);
  if (error) {
    console.error("Delete Error:", error);
  } else {
    console.log("Successfully deleted plan with items!");
  }
}

testDeleteWithItems();
