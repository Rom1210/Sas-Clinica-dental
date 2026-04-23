const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbozzxizkuiqycdirsln.supabase.co';
const supabaseKey = 'sb_publishable_6wrpyyozFzDjKKxVl_MORw_1aTLzTe2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { data: plans } = await supabase.from('treatment_plans').select('id, name').ilike('name', 'Plan de Tratamiento General');
  
  if (plans && plans.length > 0) {
    console.log(`Found ${plans.length} plans to delete.`);
    for (const p of plans) {
      await supabase.from('treatment_plans').delete().eq('id', p.id);
      console.log(`Deleted ${p.id}`);
    }
  } else {
    console.log('No plans found to clean up.');
  }

  // Also clean up any that might have 0 total_amount just in case they have a different name
  const { data: zeroPlans } = await supabase.from('treatment_plans').select('id, name').eq('total_amount', 0);
  if (zeroPlans && zeroPlans.length > 0) {
    for (const p of zeroPlans) {
      await supabase.from('treatment_plans').delete().eq('id', p.id);
      console.log(`Deleted zero-amount plan ${p.id}`);
    }
  }
}

cleanup();
