
-- 1. Roles infrastructure (separate user_roles table per security best practices)
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. ORDERS: restrict admin policy to actual admins; tighten public insert
DROP POLICY IF EXISTS "Admin all orders" ON public.orders;
CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public can create orders for active products"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(customer_name) > 0
    AND product_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND active = true
    )
  );

-- 3. DISCOUNT_CODES: remove public read; expose only a validation RPC
DROP POLICY IF EXISTS "Public read discount_codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admin all codes" ON public.discount_codes;
CREATE POLICY "Admins manage discount codes"
  ON public.discount_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.discount_codes FROM anon;

CREATE OR REPLACE FUNCTION public.validate_discount_code(_code text)
RETURNS TABLE(code text, discount_type text, discount_value numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT dc.code, dc.discount_type, dc.discount_value
  FROM public.discount_codes dc
  WHERE upper(dc.code) = upper(_code)
    AND dc.active = true
    AND (dc.expires_at IS NULL OR dc.expires_at > now())
    AND (dc.max_uses IS NULL OR coalesce(dc.uses_count, 0) < dc.max_uses)
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text) TO anon, authenticated;

-- 4. PRODUCTS: restrict admin write policy to actual admins (public read kept)
DROP POLICY IF EXISTS "Admin all products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. SITE_SETTINGS: restrict admin policy to admins (public read kept — pixel IDs and brand
-- assets are rendered on the storefront and are public by nature)
DROP POLICY IF EXISTS "Admin all settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
