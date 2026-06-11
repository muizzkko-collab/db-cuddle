-- Replace product-images modify policies to require admin
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;

CREATE POLICY "Admins upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public bucket still serves files via CDN without a SELECT policy.