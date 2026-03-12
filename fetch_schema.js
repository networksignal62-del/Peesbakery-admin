const fs = require('fs');

async function fetchSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvmpuuguuhfaoxmvgvwa.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2Mjg4NiwiZXhwIjoyMDg4NzM4ODg2fQ.3XqgkktBPafHhqF4z84lK-8RElqNgg0yjwzmmXlA5nQ";

  const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
    headers: {
      "Authorization": `Bearer ${key}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch schema", res.status, res.statusText, await res.text());
    return;
  }

  const data = await res.json();
  fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
  console.log("Schema saved to schema.json");
  
  // Also print an overview of table names
  if (data.definitions) {
    console.log("Tables:");
    console.log(Object.keys(data.definitions).join(", "));
  }
}

fetchSchema();
