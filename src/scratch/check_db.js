import { supabase } from '../lib/supabase';

async function checkColumns() {
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  if (error) {
    console.error('Error fetching payments:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in payments:', Object.keys(data[0]));
  } else {
    console.log('No data in payments table to check columns.');
    // Try to get a row from any patient to see structure
    const { data: allData } = await supabase.from('payments').select('*').limit(1);
    console.log('All payments sample:', allData);
  }
}

checkColumns();
