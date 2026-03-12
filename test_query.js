const fs = require('fs');

async function testQuery() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvmpuuguuhfaoxmvgvwa.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2Mjg4NiwiZXhwIjoyMDg4NzM4ODg2fQ.3XqgkktBPafHhqF4z84lK-8RElqNgg0yjwzmmXlA5nQ";

  for (const table of ['products?select=*,product_variants(*),product_addons(*)', 'orders?select=*,order_items(*)', 'categories?select=*']) {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      headers: { "Authorization": `Bearer ${key}`, "apikey": key }
    });
    console.log(`\nTable ${table}: ${res.status}`);
    if (!res.ok) {
      console.log(await res.text());
    }
  }
}

testQuery();
