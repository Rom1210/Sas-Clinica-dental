import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const email = 'ceomjs@gmail.com';
  
  // 1. Get user id from auth.users (not possible from anon client unless we have a specific endpoint, wait we can query profiles if email is there)
  const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('email', email);
  console.log('Profiles:', profile, profErr);

  // If profile exists, check org users
  if (profile && profile.length > 0) {
    const userId = profile[0].id;
    const { data: orgUsers, error: orgErr } = await supabase.from('organization_users').select('*').eq('user_id', userId);
    console.log('Organization Users:', orgUsers, orgErr);
  } else {
    // If we can't find by email, maybe email isn't in profiles
    const { data: allProfiles } = await supabase.from('profiles').select('*');
    console.log('All profiles:', allProfiles);
    const { data: allOrgs } = await supabase.from('organization_users').select('*');
    console.log('All org users:', allOrgs);
  }
}

check();
