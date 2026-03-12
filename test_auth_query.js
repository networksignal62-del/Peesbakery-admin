const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lvmpuuguuhfaoxmvgvwa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjI4ODYsImV4cCI6MjA4ODczODg4Nn0.IuV6DOInMHn3GmuSemqCXOpvLiq352BK7EJABSWcAYE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthQuery() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@peesbakery.com',
    password: 'AdminPassword123!'
  });

  if (authError) {
    console.log("Login failed:", authError.message);
    return;
  }

  console.log("Logged in!", authData.user.id);

  // Now query admin_profiles as this user
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.log("Error querying admin_profiles:", error);
  } else {
    console.log("Success! Profile:", data.full_name);
  }
}

testAuthQuery();
