import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const email = 'ceomjs@gmail.com';
  
  // 1. Get user from auth.users
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log('User not found in auth.users');
    return;
  }
  
  console.log('Found user:', user.id);

  // 2. Ensure profile exists
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: 'Fabian Romero',
    email: user.email
  });
  if (profErr) console.error('Profile err:', profErr);
  else console.log('Profile upserted');

  // 3. Get or create organization
  let { data: orgs, error: orgsErr } = await supabase.from('organizations').select('*').limit(1);
  let orgId;
  if (!orgs || orgs.length === 0) {
    const { data: newOrg, error: newOrgErr } = await supabase.from('organizations').insert({ name: 'SmartDental' }).select();
    if (newOrgErr) console.error('Org insert err:', newOrgErr);
    orgId = newOrg[0].id;
  } else {
    orgId = orgs[0].id;
    // update name just in case
    await supabase.from('organizations').update({ name: 'SmartDental' }).eq('id', orgId);
  }
  console.log('Org ID:', orgId);

  // 4. Link user to organization in organization_users
  const { error: linkErr } = await supabase.from('organization_users').upsert({
    organization_id: orgId,
    user_id: user.id,
    role: 'admin',
    status: 'active',
    is_active: true
  });
  
  if (linkErr) console.error('Link err:', linkErr);
  else console.log('User linked to org successfully');
  
  // 5. Update any orphaned patients
  const { error: patErr } = await supabase.from('patients').update({ organization_id: orgId }).is('organization_id', null);
  console.log('Orphaned patients updated:', patErr || 'success');
  
  // 6. Check final state
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id);
  console.log('Final Profile:', profile);
}

fix();
