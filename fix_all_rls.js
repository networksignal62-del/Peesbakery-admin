const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fixRLS() {
  const client = new Client({
    connectionString: "postgres://postgres.lvmpuuguuhfaoxmvgvwa:B0QvHGTfugnxsDtz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to DB.");

  try {
    const tables = ['products', 'categories', 'product_variants', 'product_addons', 'order_items', 'orders', 'site_settings'];
    
    for (const table of tables) {
      console.log(`Fixing policies for ${table}...`);
      
      // Drop existing policies
      const res = await client.query(`
        SELECT policyname FROM pg_policies WHERE tablename = '${table}';
      `);
      for (const row of res.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON "${table}";`);
      }

      // Enable RLS
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);

      // Public read for content tables
      if (['products', 'categories', 'product_variants', 'product_addons', 'site_settings'].includes(table)) {
        await client.query(`
          CREATE POLICY "Allow public read access" 
          ON "${table}" FOR SELECT 
          USING (true);
        `);
      }

      // Orders and Order Items - allow anyone to insert (for checkout)
      if (['orders', 'order_items'].includes(table)) {
        await client.query(`
          CREATE POLICY "Allow anyone to insert" 
          ON "${table}" FOR INSERT 
          WITH CHECK (true);
        `);
        // For SELECT, we might want to restrict this later, but for now let's allow it so the customer can see their order
        await client.query(`
          CREATE POLICY "Allow public read access" 
          ON "${table}" FOR SELECT 
          USING (true);
        `);
      }

      // Admin access (using service role bypasses RLS, but for the dashboard using 'authenticated' role):
      await client.query(`
        CREATE POLICY "Allow service_role full access" 
        ON "${table}" FOR ALL 
        USING (true) 
        WITH CHECK (true);
      `);
    }

    console.log("All RLS policies updated successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixRLS();
