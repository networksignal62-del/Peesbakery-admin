const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkRLS() {
  const client = new Client({
    connectionString: "postgres://postgres.lvmpuuguuhfaoxmvgvwa:B0QvHGTfugnxsDtz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const res = await client.query(`
      SELECT tablename, policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);
    
    console.log('Current Policies:');
    console.log(JSON.stringify(res.rows, null, 2));

    const tablesRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log('Row Security Status:');
    console.table(tablesRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkRLS();
