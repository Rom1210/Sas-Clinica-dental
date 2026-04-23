
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing to avoid dependency issues with dotenv in a quick script
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials in .env');
  process.exit(1);
}

console.log('Using URL:', supabaseUrl);
console.log('Using Key (prefix):', supabaseKey.substring(0, 15) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (error) {
           console.error('Database access failed:', error.message);
      if (error.message.includes('JWT')) {
        console.log('Suggestion: The sb_ keys might be causing JWT validation issues if the server expects classic JWTs.');
      }
    } else {
      console.log('Database access SUCCESSFUL!');
      console.log('Total patients:', count);
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

check();
