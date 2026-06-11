
-- 1) order_items policies
DROP POLICY IF EXISTS "Admin all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;

CREATE POLICY "Admins manage order_items"
  ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public insert order_items for recent orders"
  ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.created_at > now() - interval '10 minutes'
    )
  );

-- 2) site_settings: hide support_email from public role via column grants
REVOKE SELECT ON public.site_settings FROM anon;
GRANT SELECT (
  id, subdomain, brand_color, button_text_color, logo_url, favicon_url,
  gtm_id, meta_pixel_id, ga4_id, tiktok_pixel_id, thank_you_redirect_url,
  template_id, background_color, headline_color, text_color, button_style,
  font_family, custom_css, created_at
) ON public.site_settings TO anon;

-- authenticated still needs broad access for admin screens (RLS restricts rows)
GRANT SELECT ON public.site_settings TO authenticated;

-- 3) Lock down has_role: only the policy engine / definer context needs it
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
