-- Atomic order + items creation
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _order jsonb,
  _items jsonb
)
RETURNS TABLE(id uuid, order_number bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order public.orders%ROWTYPE;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required';
  END IF;

  INSERT INTO public.orders (
    customer_name, email, phone,
    address_line1, address_line2, city, postcode, country,
    total, subtotal, currency,
    payment_method, payment_status, order_status,
    source_domain, quantity, product_name, product_id
  )
  VALUES (
    _order->>'customer_name', _order->>'email', _order->>'phone',
    _order->>'address_line1', NULLIF(_order->>'address_line2',''),
    _order->>'city', _order->>'postcode', _order->>'country',
    (_order->>'total')::numeric, (_order->>'subtotal')::numeric, _order->>'currency',
    _order->>'payment_method', _order->>'payment_status', COALESCE(_order->>'order_status','pending'),
    _order->>'source_domain', (_order->>'quantity')::int,
    _order->>'product_name', NULLIF(_order->>'product_id','')::uuid
  )
  RETURNING * INTO new_order;

  INSERT INTO public.order_items (
    order_id, product_id, subdomain, product_name,
    variant_label, quantity, unit_price, total_price
  )
  SELECT
    new_order.id,
    NULLIF(i->>'product_id','')::uuid,
    i->>'subdomain',
    i->>'product_name',
    i->>'variant_label',
    (i->>'quantity')::int,
    (i->>'unit_price')::numeric,
    (i->>'total_price')::numeric
  FROM jsonb_array_elements(_items) AS i;

  id := new_order.id;
  order_number := new_order.order_number;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO anon, authenticated;

-- Remove the loose public insert policies; only admins (or the RPC above, which runs as definer) may insert
DROP POLICY IF EXISTS "Public insert order_items for recent orders" ON public.order_items;
DROP POLICY IF EXISTS "Public can create orders for active products" ON public.orders;