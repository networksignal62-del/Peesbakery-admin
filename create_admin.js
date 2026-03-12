const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lvmpuuguuhfaoxmvgvwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2Mjg4NiwiZXhwIjoyMDg4NzM4ODg2fQ.3XqgkktBPafHhqF4z84lK-8RElqNgg0yjwzmmXlA5nQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'admin@peesbakery.com';
  const password = 'AdminPassword123!';

  console.log('Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('User already exists, updating password just in case...');
      // Get user id
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError) {
        const user = usersData.users.find(u => u.email === email);
        if (user) {
          await supabase.auth.admin.updateUserById(user.id, { password });
          console.log(`Password updated. User ID: ${user.id}`);
          await ensureAdminProfile(user.id, email);
        }
      }
    } else {
      console.error('Error creating user:', authError);
    }
    return;
  }

  console.log(`User created. User ID: ${authData.user.id}`);
  await ensureAdminProfile(authData.user.id, email);
}

async function ensureAdminProfile(userId, email) {
  console.log('Ensuring admin profile exists...');
  const { data, error } = await supabase
    .from('admin_profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: 'Pee\'s Bakery Admin',
      role: 'super_admin',
      is_active: true
    }, { onConflict: 'id' });
    
  if (error) {
    console.error('Error creating profile:', error);
  } else {
    console.log('Admin profile created successfully!');
    console.log('\\n--- LOGIN CREDENTIALS ---');
    console.log(`Email: admin@peesbakery.com`);
    console.log(`Password: AdminPassword123!`);
    console.log('---------------------------\\n');
  }
}

createAdmin();
