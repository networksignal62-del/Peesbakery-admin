const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// We have to read .env.local manually since dotenv is uninstalled
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Ensuring images bucket exists...');
  const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('images', {
    public: true,
  });
  console.log('Bucket check:', bucketData, bucketError?.message);

  // The 400 error is often due to invalid file object passed to the JS SDK, or sometimes RLS.
  // Wait, if I'm uploading directly from Next.js server actions, maybe I can use the supabase admin key on the server,
  // but right now the upload is from the frontend browser (`ProductFormPage.tsx` using `createClient()`).
  
  // Since the user asked admin to upload multiple pictures, let's fix the schema of products table as well.
  // Can we make `image` column store an array? No, it's probably better to just add a new column like `gallery_images` text[]
  // Or since it's a simple app, maybe just use CSV string in the existing `image` column? No, UI needs it. 
  // Let's add `gallery_images` of type text[] to `products`.

  const query = `
    -- Enable public access to 'images' bucket
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'images' );

    -- Allow authenticated admin users to insert objects
    CREATE POLICY "Admin Insert"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'images' );

    CREATE POLICY "Admin Update"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'images' );

    CREATE POLICY "Admin Delete"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'images' );
  `;
}

setup();
