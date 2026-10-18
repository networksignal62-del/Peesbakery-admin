-- Apply in Supabase before deploying the matching application code.
-- Keeps guest ordering atomic and makes the database enforce staff permissions.
BEGIN;

ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'waiter'));

-- Earlier admin builds saved category display names; the customer menu filters by stable IDs.
UPDATE public.products AS product SET category = category.id
FROM public.categories AS category
WHERE product.category = category.name AND product.category IS DISTINCT FROM category.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.products AS product
    LEFT JOIN public.categories AS category ON category.id = product.category
    WHERE category.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unmapped product categories. Review products.category before applying this migration.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_valid_price') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_valid_price
      CHECK (price >= 0 AND price <= 1000000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variants_valid_price') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT variants_valid_price
      CHECK (price >= 0 AND price <= 1000000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addons_valid_price') THEN
    ALTER TABLE public.product_addons ADD CONSTRAINT addons_valid_price
      CHECK (price >= 0 AND price <= 1000000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_fkey
      FOREIGN KEY (category) REFERENCES public.categories(id) ON DELETE RESTRICT NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.products VALIDATE CONSTRAINT products_category_fkey;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.has_staff_role(allowed_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = (SELECT auth.uid()) AND is_active = true AND role = ANY(allowed_roles)
  );
$$;
REVOKE ALL ON FUNCTION private.has_staff_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_staff_role(text[]) TO authenticated;

-- Rebuild policies from a known set. Any older permissive policy would otherwise
-- combine with these using OR and silently restore access.
DO $$
DECLARE old_policy record;
BEGIN
  FOR old_policy IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(ARRAY[
      'admin_profiles','products','product_variants','product_addons','product_images',
      'categories','site_settings','orders','order_items','order_status_history'
    ])
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', old_policy.policyname, old_policy.schemaname, old_policy.tablename);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON public.admin_profiles;
CREATE POLICY "Staff can view own profile" ON public.admin_profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Managers can view all products" ON public.products
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update products" ON public.products
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can delete products" ON public.products
  FOR DELETE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active));
CREATE POLICY "Managers can view all variants" ON public.product_variants
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert variants" ON public.product_variants
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update variants" ON public.product_variants
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can delete variants" ON public.product_variants
  FOR DELETE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

DROP POLICY IF EXISTS "Product addons are viewable by everyone" ON public.product_addons;
DROP POLICY IF EXISTS "Admins can manage product addons" ON public.product_addons;
CREATE POLICY "Public can view active addons" ON public.product_addons
  FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active));
CREATE POLICY "Managers can view all addons" ON public.product_addons
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert addons" ON public.product_addons
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update addons" ON public.product_addons
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can delete addons" ON public.product_addons
  FOR DELETE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Public can view active product images" ON public.product_images
  FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active));
CREATE POLICY "Managers can view all product images" ON public.product_images
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert product images" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update product images" ON public.product_images
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can delete product images" ON public.product_images
  FOR DELETE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Managers can view all categories" ON public.categories
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update categories" ON public.categories
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can delete categories" ON public.categories
  FOR DELETE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Public can view contact settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (key IN ('restaurant_name','phone','whatsapp','address','delivery_fee','currency','opening_hours','is_open','checkout_whatsapp','order_phone'));
CREATE POLICY "Managers can view all settings" ON public.site_settings
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can insert settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));
CREATE POLICY "Managers can update settings" ON public.site_settings
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager'])));

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Order staff can view orders" ON public.orders
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager','staff'])));
CREATE POLICY "Order staff can update orders" ON public.orders
  FOR UPDATE TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager','staff'])))
  WITH CHECK ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager','staff'])));

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Order staff can view order items" ON public.order_items
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager','staff'])));

DROP POLICY IF EXISTS "Order staff can view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Order staff can add status history" ON public.order_status_history;
CREATE POLICY "Order staff can view status history" ON public.order_status_history
  FOR SELECT TO authenticated USING ((SELECT private.has_staff_role(ARRAY['super_admin','admin','manager','staff'])));

CREATE OR REPLACE FUNCTION private.record_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history(order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Order placed');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, status, note)
    VALUES (NEW.id, NEW.status, coalesce(nullif(current_setting('app.order_status_note', true), ''), 'Status updated'));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS record_order_status ON public.orders;
CREATE TRIGGER record_order_status AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION private.record_order_status();
INSERT INTO public.order_status_history(order_id, status, note)
SELECT order_row.id, order_row.status, 'Current status when timeline was added'
FROM public.orders AS order_row
WHERE NOT EXISTS (SELECT 1 FROM public.order_status_history AS history WHERE history.order_id = order_row.id);

-- Grants narrow the Data API operations even if a policy changes later.
REVOKE ALL ON public.admin_profiles, public.orders, public.order_items, public.order_status_history FROM anon, authenticated;
GRANT SELECT ON public.admin_profiles TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;

REVOKE ALL ON public.products, public.product_variants, public.product_addons, public.product_images, public.categories, public.site_settings FROM anon, authenticated;
GRANT SELECT ON public.products, public.product_variants, public.product_addons, public.product_images, public.categories, public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products, public.product_variants, public.product_addons, public.product_images, public.categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq, public.product_variants_id_seq, public.product_addons_id_seq, public.product_images_id_seq, public.site_settings_id_seq TO authenticated;

CREATE OR REPLACE FUNCTION public.set_order_status(p_order_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT private.has_staff_role(ARRAY['super_admin','admin','manager','staff']) THEN
    RAISE EXCEPTION 'Order access required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(p_status NOT IN ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled'), true)
     OR length(coalesce(p_note,'')) > 500 THEN
    RAISE EXCEPTION 'Invalid order status' USING ERRCODE = '22023';
  END IF;
  PERFORM set_config('app.order_status_note', coalesce(nullif(trim(p_note),''), 'Status updated'), true);
  UPDATE public.orders SET status = p_status, updated_at = now() WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = '22023'; END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.set_order_status(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_public_settings(p_settings jsonb)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  setting_row record;
BEGIN
  IF NOT private.has_staff_role(ARRAY['super_admin','admin','manager']) THEN
    RAISE EXCEPTION 'Settings access required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_settings) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid settings' USING ERRCODE = '22023';
  END IF;
  FOR setting_row IN SELECT key, value FROM jsonb_each_text(p_settings) LOOP
    IF setting_row.key NOT IN ('restaurant_name','phone','whatsapp','checkout_whatsapp',
      'order_phone','address','opening_hours','delivery_fee','currency','is_open')
       OR length(setting_row.value) > 500 THEN
      RAISE EXCEPTION 'Invalid setting' USING ERRCODE = '22023';
    END IF;
    IF setting_row.key IN ('phone','whatsapp','checkout_whatsapp','order_phone')
       AND setting_row.value !~ '^\+?[0-9 ()-]{8,24}$' THEN
      RAISE EXCEPTION 'Invalid contact number' USING ERRCODE = '22023';
    END IF;
    IF setting_row.key = 'delivery_fee' AND
       (setting_row.value !~ '^[0-9]+(\.[0-9]{1,2})?$'
        OR setting_row.value::numeric > 10000) THEN
      RAISE EXCEPTION 'Invalid delivery fee' USING ERRCODE = '22023';
    END IF;
    IF setting_row.key = 'is_open' AND setting_row.value NOT IN ('true','false') THEN
      RAISE EXCEPTION 'Invalid restaurant status' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.site_settings(key,value,updated_at) VALUES (setting_row.key,setting_row.value,now())
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
  END LOOP;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.save_public_settings(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_public_settings(jsonb) TO authenticated;

-- Save a product and its options in one transaction so a failed option does not
-- leave a partially updated customer menu.
CREATE OR REPLACE FUNCTION public.save_catalog_product(
  p_product_id integer,
  p_product jsonb,
  p_variants jsonb,
  p_addons jsonb
) RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  saved_id integer;
  price_value numeric;
  option_row jsonb;
  option_price numeric;
BEGIN
  IF NOT private.has_staff_role(ARRAY['super_admin','admin','manager']) THEN
    RAISE EXCEPTION 'Catalog access required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_product) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_variants) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_addons) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_variants) > 50
     OR jsonb_array_length(p_addons) > 50 THEN
    RAISE EXCEPTION 'Invalid product details' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(p_product->>'name',''))) NOT BETWEEN 2 AND 120
     OR jsonb_typeof(p_product->'price') IS DISTINCT FROM 'number'
     OR length(coalesce(p_product->>'description','')) > 1000
     OR length(coalesce(p_product->>'long_description','')) > 5000
     OR length(coalesce(p_product->>'image','')) > 10000
     OR coalesce(p_product->>'category','') = 'all'
     OR NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_product->>'category') THEN
    RAISE EXCEPTION 'Invalid product details' USING ERRCODE = '22023';
  END IF;
  price_value := (p_product->>'price')::numeric;
  IF price_value < 0 OR price_value > 1000000 THEN
    RAISE EXCEPTION 'Invalid product price' USING ERRCODE = '22023';
  END IF;

  IF p_product_id IS NULL THEN
    INSERT INTO public.products(name, category, price, image, description, long_description,
      featured, is_active, is_customizable)
    VALUES (trim(p_product->>'name'), p_product->>'category', price_value,
      nullif(p_product->>'image',''), nullif(p_product->>'description',''),
      nullif(p_product->>'long_description',''), coalesce((p_product->>'featured')::boolean,false),
      coalesce((p_product->>'is_active')::boolean,true), coalesce((p_product->>'is_customizable')::boolean,false))
    RETURNING id INTO saved_id;
  ELSE
    UPDATE public.products SET name = trim(p_product->>'name'), category = p_product->>'category',
      price = price_value, image = nullif(p_product->>'image',''),
      description = nullif(p_product->>'description',''),
      long_description = nullif(p_product->>'long_description',''),
      featured = coalesce((p_product->>'featured')::boolean,false),
      is_active = coalesce((p_product->>'is_active')::boolean,true),
      is_customizable = coalesce((p_product->>'is_customizable')::boolean,false), updated_at = now()
    WHERE id = p_product_id RETURNING id INTO saved_id;
    IF saved_id IS NULL THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = '22023'; END IF;
  END IF;

  DELETE FROM public.product_variants WHERE product_id = saved_id;
  FOR option_row IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
    IF jsonb_typeof(option_row) IS DISTINCT FROM 'object'
       OR length(trim(coalesce(option_row->>'name',''))) NOT BETWEEN 1 AND 120
       OR jsonb_typeof(option_row->'price') IS DISTINCT FROM 'number'
       OR length(coalesce(option_row->>'description','')) > 1000 THEN
      RAISE EXCEPTION 'Invalid product option' USING ERRCODE = '22023';
    END IF;
    option_price := (option_row->>'price')::numeric;
    IF option_price < 0 OR option_price > 1000000 THEN RAISE EXCEPTION 'Invalid product option' USING ERRCODE = '22023'; END IF;
    INSERT INTO public.product_variants(product_id, name, price, description)
    VALUES (saved_id, trim(option_row->>'name'), option_price, nullif(option_row->>'description',''));
  END LOOP;

  DELETE FROM public.product_addons WHERE product_id = saved_id;
  FOR option_row IN SELECT value FROM jsonb_array_elements(p_addons) LOOP
    IF jsonb_typeof(option_row) IS DISTINCT FROM 'object'
       OR length(trim(coalesce(option_row->>'name',''))) NOT BETWEEN 1 AND 120
       OR jsonb_typeof(option_row->'price') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Invalid add-on' USING ERRCODE = '22023';
    END IF;
    option_price := (option_row->>'price')::numeric;
    IF option_price < 0 OR option_price > 1000000 THEN RAISE EXCEPTION 'Invalid add-on' USING ERRCODE = '22023'; END IF;
    INSERT INTO public.product_addons(product_id, name, price)
    VALUES (saved_id, trim(option_row->>'name'), option_price);
  END LOOP;
  RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_catalog_product(integer,jsonb,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_catalog_product(integer,jsonb,jsonb,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.create_guest_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_delivery_method text,
  p_payment_method text,
  p_payment_proof_url text,
  p_notes text,
  p_items jsonb,
  p_expected_total numeric
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item jsonb;
  addon jsonb;
  product_row record;
  addon_row record;
  order_id uuid := gen_random_uuid();
  quantity_value integer;
  unit_price numeric(10,2);
  item_total numeric(10,2);
  subtotal_value numeric(10,2) := 0;
  delivery_value numeric(10,2) := 0;
  total_value numeric(10,2);
  variant_value text;
  addon_list jsonb;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid order details' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(p_customer_name, ''))) NOT BETWEEN 2 AND 120
     OR coalesce(p_customer_phone !~ '^\+?[0-9 ()-]{7,24}$', true)
     OR coalesce(p_delivery_method NOT IN ('delivery','pickup'), true)
     OR coalesce(p_payment_method NOT IN ('cash','orange_money','afrimoney'), true)
     OR (p_delivery_method = 'delivery' AND length(trim(coalesce(p_customer_address,''))) NOT BETWEEN 5 AND 300)
     OR length(coalesce(p_notes,'')) > 2000
     OR (p_payment_proof_url IS NOT NULL AND (length(p_payment_proof_url) > 1000 OR p_payment_proof_url !~ '^https://'))
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30
  THEN RAISE EXCEPTION 'Invalid order details' USING ERRCODE = '22023'; END IF;

  IF p_delivery_method = 'delivery' THEN
    SELECT COALESCE(NULLIF(value, '')::numeric, 25) INTO delivery_value
      FROM public.site_settings WHERE key = 'delivery_fee';
    delivery_value := COALESCE(delivery_value, 25);
    IF delivery_value < 0 OR delivery_value > 10000 THEN
      RAISE EXCEPTION 'Invalid delivery fee' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'is_open' AND value = 'false') THEN
    RAISE EXCEPTION 'Orders are temporarily closed' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (id, customer_name, customer_phone, customer_address, delivery_method,
    payment_method, payment_proof_url, subtotal, delivery_fee, total, status, notes)
  VALUES (order_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_address,'')),''),
    p_delivery_method, p_payment_method, p_payment_proof_url, 0, delivery_value, 0, 'pending', p_notes);

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(item) <> 'object' OR (item->>'productId') !~ '^[0-9]{1,9}$'
       OR (item->>'quantity') !~ '^[0-9]{1,2}$'
    THEN RAISE EXCEPTION 'Invalid order item' USING ERRCODE = '22023'; END IF;
    quantity_value := (item->>'quantity')::integer;
    IF quantity_value NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = '22023'; END IF;

    SELECT id, name, price INTO product_row FROM public.products
      WHERE id = (item->>'productId')::integer AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'A product is no longer available' USING ERRCODE = '22023'; END IF;
    unit_price := product_row.price;
    variant_value := nullif(trim(coalesce(item->>'variantName','')), '');
    IF variant_value IS NOT NULL THEN
      SELECT price INTO unit_price FROM public.product_variants
        WHERE product_id = product_row.id AND name = variant_value;
      IF NOT FOUND THEN RAISE EXCEPTION 'A product option is no longer available' USING ERRCODE = '22023'; END IF;
    END IF;

    addon_list := '[]'::jsonb;
    IF item ? 'addons' AND jsonb_typeof(item->'addons') <> 'array' THEN
      RAISE EXCEPTION 'Invalid add-ons' USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(COALESCE(item->'addons','[]'::jsonb)) > 20 THEN
      RAISE EXCEPTION 'Too many add-ons' USING ERRCODE = '22023';
    END IF;
    FOR addon IN SELECT value FROM jsonb_array_elements(COALESCE(item->'addons','[]'::jsonb)) LOOP
      IF jsonb_typeof(addon) <> 'object' OR length(coalesce(addon->>'name','')) > 120 THEN
        RAISE EXCEPTION 'Invalid add-on' USING ERRCODE = '22023';
      END IF;
      SELECT name, price INTO addon_row FROM public.product_addons
        WHERE product_id = product_row.id AND name = addon->>'name';
      IF NOT FOUND THEN RAISE EXCEPTION 'An add-on is no longer available' USING ERRCODE = '22023'; END IF;
      unit_price := unit_price + addon_row.price;
      addon_list := addon_list || jsonb_build_array(jsonb_build_object('name', addon_row.name, 'price', addon_row.price));
    END LOOP;

    IF unit_price < 0 OR unit_price > 1000000 THEN RAISE EXCEPTION 'Invalid price' USING ERRCODE = '22023'; END IF;
    item_total := round(unit_price * quantity_value, 2);
    subtotal_value := subtotal_value + item_total;
    INSERT INTO public.order_items (order_id, product_id, product_name, variant_name, quantity,
      unit_price, total_price, addons, special_instructions)
    VALUES (order_id, product_row.id, product_row.name, variant_value, quantity_value,
      unit_price, item_total, addon_list, left(coalesce(item->>'specialInstructions',''), 500));
  END LOOP;

  total_value := round(subtotal_value + delivery_value, 2);
  IF p_expected_total IS NULL OR round(p_expected_total,2) <> total_value THEN
    RAISE EXCEPTION 'Prices changed. Refresh the menu and review your cart.' USING ERRCODE = '22023';
  END IF;
  UPDATE public.orders SET subtotal = subtotal_value, delivery_fee = delivery_value, total = total_value
    WHERE id = order_id;
  RETURN jsonb_build_object('id', order_id, 'subtotal', subtotal_value,
    'deliveryFee', delivery_value, 'total', total_value);
END;
$$;
REVOKE ALL ON FUNCTION private.create_guest_order(text,text,text,text,text,text,text,jsonb,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_guest_order(text,text,text,text,text,text,text,jsonb,numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name text, p_customer_phone text, p_customer_address text,
  p_delivery_method text, p_payment_method text, p_payment_proof_url text,
  p_notes text, p_items jsonb, p_expected_total numeric
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.create_guest_order(p_customer_name, p_customer_phone, p_customer_address,
    p_delivery_method, p_payment_method, p_payment_proof_url, p_notes, p_items, p_expected_total);
$$;
REVOKE ALL ON FUNCTION public.place_order(text,text,text,text,text,text,text,jsonb,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,text,text,text,jsonb,numeric) TO anon, authenticated;

INSERT INTO public.site_settings(key, value) VALUES
  ('checkout_whatsapp', '+232 33 680260'),
  ('order_phone', '+232 75 361494'),
  ('is_open', 'true')
ON CONFLICT (key) DO NOTHING;

UPDATE public.site_settings SET value = '90A Regent Road, Old School Junction, Freetown, Sierra Leone'
WHERE key = 'address' AND value = 'Freetown, Sierra Leone';

COMMIT;
