const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fixPolicies() {
  const client = new Client({
    connectionString: "postgres://postgres.lvmpuuguuhfaoxmvgvwa:B0QvHGTfugnxsDtz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log("Connected to DB.");

  try {
    const res = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'admin_profiles';
    `);
    
    console.log('Current Policies:', res.rows);

    console.log("Dropping all existing policies on admin_profiles...");
    for (const row of res.rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON admin_profiles;`);
    }

    console.log("Creating proper policy for admin_profiles...");
    // Allow users to view their own profile, or just let everyone view profiles (it's safe).
    await client.query(`
      CREATE POLICY "Allow public read access to admin profiles" 
      ON admin_profiles FOR SELECT 
      USING (true);
    `);

    // Only allow service role to insert/update, or the user themselves
    await client.query(`
      CREATE POLICY "Allow users to update their own profile" 
      ON admin_profiles FOR UPDATE 
      USING (auth.uid() = id);
    `);
    
    // Create an insert policy just in case
    await client.query(`
      CREATE POLICY "Allow users to insert their own profile" 
      ON admin_profiles FOR INSERT 
      WITH CHECK (auth.uid() = id);
    `);

    console.log("Policies reset successfully!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixPolicies();
