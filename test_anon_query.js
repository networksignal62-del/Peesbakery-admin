const fs = require('fs');

async function testQuery() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvmpuuguuhfaoxmvgvwa.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjI4ODYsImV4cCI6MjA4ODczODg4Nn0.IuV6DOInMHn3GmuSemqCXOpvLiq352BK7EJABSWcAYE";

  const res = await fetch(`${url}/rest/v1/admin_profiles?select=*&id=eq.c27a770e-f2bd-4c8a-b6ad-19a627dfe9f3`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}

testQuery();
