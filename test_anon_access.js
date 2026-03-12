const fs = require('fs');

async function testAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvmpuuguuhfaoxmvgvwa.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjI4ODYsImV4cCI6MjA4ODczODg4Nn0.IuV6DOInMHn3GmuSemqCXOpvLiq352BK7EJABSWcAYE";

  for (const table of ['products', 'orders', 'categories']) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    console.log(`Table ${table} with Anon Key: ${res.status}`);
  }
}

testAnon();
