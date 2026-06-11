## Country routing system for subdomain checkouts

Big change across DB, checkout, admin, and tracking. Plan first; once approved I'll run the migration + code edits.

### 1. Database (one migration)

New tables in `public`:

- **`country_settings`** — global per-country config
  - `country_code` (PK, text: uk/us/de/ca/au)
  - `country_name`, `currency`, `currency_symbol`, `flag_emoji`, `phone_prefix`, `postcode_label`, `iso_country` (GB/US/...)
  - `meta_pixel_id`, `gtm_id`, `tiktok_pixel_id`, `ga4_id` (reference only)
  - `active` bool
  - Seed all 5 rows.

- **`product_country_settings`** — per product+country pricing overrides
  - `subdomain`, `country_code` (composite unique)
  - `country_name`, `currency`, `currency_symbol`
  - `price_1`, `price_2`, `price_3`, `bump_price`, `upsell_price` (nullable)
  - `active` bool

Both tables: GRANTs (anon+authenticated SELECT, authenticated/admin write via policy, service_role ALL), RLS on, policies: public SELECT, admin-only write via `has_role(auth.uid(),'admin')`.

Add `country_code` text column to `orders` (ISO: GB/US/...).

### 2. Subdomain checkout routing

Currently `src/routes/index.tsx` detects subdomain and renders `<CheckoutPage subdomain=... />`. Extend it:

- Read first URL path segment as `countryCode` (or `?country=` preview override).
- If missing → fetch `https://ipapi.co/json/`, map to supported code (fallback `uk`), `history.replaceState` to `/[code]`.
- If invalid → replace to `/uk`.
- Pass `countryCode` into `<CheckoutPage>`.

Add a catch-all subdomain route file `src/routes/$countryCode.tsx` that renders the same component when on a subdomain host (otherwise falls through to existing routes — guard by host). Simpler: keep detection in `index.tsx` using `window.location.pathname`, no new route — avoids colliding with `/shop`, `/about`, etc. on main domain.

Actually since the main domain has many top-level routes (`/shop`, `/about`...), using a `$countryCode` route would conflict. Approach: in `index.tsx` (which already gates on subdomain hostname), read `window.location.pathname` first segment for the country. Same for any deep links — since subdomains only serve checkout, this is fine. On subdomain, also add a small effect that intercepts navigation to keep the path.

### 3. CheckoutPage refactor (`src/components/checkout-page.tsx`)

- Accept `countryCode` prop.
- Load product + `product_country_settings` row + `site_settings` in parallel.
- Compute effective `{ price_1, price_2, price_3, bump_price, upsell_price, currency, currency_symbol }` using the priority rule.
- Replace all hardcoded `£` with `currency_symbol`.
- Pre-select country dropdown, phone prefix, postcode label per country.
- Country switcher (flag + name) in top header, dropdown navigates to `/[code]` with reload.
- Preview banner: `Preview — buyvoltix — 🇬🇧 UK — Template 1`.

### 4. GTM / dataLayer

- Inject GTM script from `site_settings.gtm_id` on mount.
- Push `page_view` event with country/currency/product/subdomain.
- On `thank-you.tsx`, push `purchase` event from order data (read order by id/number from query string).

### 5. Order saving

Update `checkout.tsx` `createOrder`:
- Pass `country` (ISO: GB/US/...), `currency`, `source_domain = hostname + pathname`.
- Pass lowercase currency to Stripe (when Stripe is wired — keep existing flow, just lower-case mapping).
- Extend RPC `create_order_with_items` to also accept/store `country_code` on orders (add column + update fn).

### 6. Admin — Countries tab

- New route `src/routes/admin.countries.tsx`.
- Sidebar link in `admin.tsx`.
- Table: Flag · Country · Currency · Meta Pixel · GTM · TikTok · GA4 — inline editable, per-row Save (upsert into `country_settings`).

### 7. Admin — Products: Country Pricing

In `admin.products.tsx` Edit panel, add 5-accordion section:
- Per country: Active toggle, price_1/2/3, bump_price, upsell_price, Save.
- Upsert into `product_country_settings`. Delete row if all prices blank AND inactive.

### Technical notes

- Country config lives client-side as a constant map (in `src/lib/countries.ts`) to avoid extra query for static data; `country_settings` table only stores editable pixel/GTM IDs.
- All new admin writes use existing authenticated supabase client + RLS admin policy.
- Thank-you page needs to know order; if `?orderId=` is not passed, push minimal event from cart context fallback.

### Out of scope (will note for follow-up)

- Actual Stripe currency switching beyond passing the lowercase code (Stripe wiring not visible in current code; will pass when present).

Confirm and I'll run the migration and ship the code.
