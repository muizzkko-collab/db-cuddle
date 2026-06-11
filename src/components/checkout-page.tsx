import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, SUPPORTED_COUNTRIES, getCountry, type CountryCode } from "@/lib/countries";

type Product = {
  id: string;
  subdomain: string;
  product_name: string;
  headline: string | null;
  subheadline: string | null;
  image_url: string | null;
  checkout_image_url?: string | null;
  images?: string[] | null;
  price_1: number; label_1: string | null;
  price_2: number; label_2: string | null;
  price_3: number; label_3: string | null;
  price_4: number; label_4: string | null;
  default_variant: number | null;
  bump_enabled: boolean | null;
  bump_text: string | null;
  bump_price: number | null;
  upsell_enabled: boolean | null;
  countdown_minutes: number | null;
  stock_count: number | null;
  why_choose_title: string | null;
  why_choose_items: Array<{ icon?: string; title?: string; body?: string }> | null;
  reviews_title: string | null;
  reviews: Array<{ name?: string; title?: string; text?: string }> | null;
  colors: Array<{ name?: string; hex?: string }> | null;
};

type SiteSettings = {
  brand_color: string | null;
  button_text_color: string | null;
  background_color: string | null;
  headline_color: string | null;
  text_color: string | null;
  logo_url: string | null;
  template_id: number | null;
  button_style: string | null;
  font_family: string | null;
  custom_css: string | null;
};

// Country-aware checkout settings derived from the resolved CountryCode
type PriceOverride = {
  price_1: number | null; price_2: number | null; price_3: number | null;
  bump_price: number | null; upsell_price: number | null;
  currency: string; currency_symbol: string; active: boolean;
} | null;


const fmt = (s: string, n: number) => `${s}${n.toFixed(2)}`;

const radiusFor = (style?: string | null) =>
  style === "square" ? "0px" : style === "pill" ? "999px" : "8px";

type SiteSettingsWithGtm = SiteSettings & { gtm_id?: string | null };

export function CheckoutPage({ subdomain, countryCode, countryFixed = false }: { subdomain: string; countryCode: CountryCode; countryFixed?: boolean }) {
  const countryCfg = getCountry(countryCode);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<SiteSettingsWithGtm | null>(null);
  const [override, setOverride] = useState<PriceOverride>(null);
  const [notFound, setNotFound] = useState(false);

  const [variant, setVariant] = useState(2);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [bump, setBump] = useState(false);
  const [country, setCountry] = useState<string>(countryCfg.iso);
  const [form, setForm] = useState({
    customer_name: "", email: "", phone: "",
    address_line1: "", address_line2: "",
    city: "", postcode: "",
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{ code: string; percent?: number; amount?: number; message: string; valid: boolean } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

  // Effective currency: per-country override row > country default
  const curr = useMemo(() => {
    if (override && override.active) {
      return { code: override.currency, symbol: override.currency_symbol };
    }
    return { code: countryCfg.currency, symbol: countryCfg.currency_symbol };
  }, [override, countryCfg]);

  const DIAL_FOR = (iso: string) => {
    const found = SUPPORTED_COUNTRIES.find((c) => COUNTRIES[c].iso === iso);
    return found ? COUNTRIES[found].phone_prefix : "+44";
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: p }, { data: s }, { data: ov }] = await Promise.all([
        supabase.from("products").select("*").eq("subdomain", subdomain).neq("active", false).maybeSingle(),
        supabase.from("site_settings").select("id,subdomain,brand_color,button_text_color,logo_url,favicon_url,gtm_id,meta_pixel_id,ga4_id,tiktok_pixel_id,thank_you_redirect_url,template_id,background_color,headline_color,text_color,button_style,font_family,custom_css,created_at").eq("subdomain", subdomain).maybeSingle(),
        supabase.from("product_country_settings").select("*").eq("subdomain", subdomain).eq("country_code", countryCode).eq("active", true).maybeSingle(),
      ]);
      if (cancelled) return;
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProduct(p as Product);
      setSettings((s as SiteSettingsWithGtm) ?? null);
      setOverride((ov as PriceOverride) ?? null);
      setVariant(2);
      if (p.countdown_minutes) setSecondsLeft(p.countdown_minutes * 60);
      setLoading(false);
    })();
    setCountry(countryCfg.iso);
    return () => { cancelled = true; };
  }, [subdomain, countryCode, countryCfg.iso]);

  // GTM injection (from product's site_settings.gtm_id)
  useEffect(() => {
    if (!settings?.gtm_id || !product) return;
    const id = settings.gtm_id;
    const w: any = window;
    w.dataLayer = w.dataLayer || [];
    if (!w.__gtm_loaded_for) w.__gtm_loaded_for = "";
    if (w.__gtm_loaded_for !== id) {
      w.__gtm_loaded_for = id;
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
      document.head.appendChild(s);
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    }
    w.dataLayer.push({
      event: "page_view",
      country_code: countryCode,
      currency: curr.code,
      product_name: product.product_name,
      subdomain,
    });
  }, [settings?.gtm_id, product, countryCode, curr.code, subdomain]);



  // Apply design tokens
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const set = (k: string, v: string) => root.style.setProperty(k, v);
    set("--brand-color", settings.brand_color || "#2563eb");
    set("--button-color", settings.brand_color || "#2563eb");
    set("--bg-color", settings.background_color || "#f9fafb");
    set("--headline-color", settings.headline_color || "#111827");
    set("--text-color", settings.text_color || "#374151");
    set("--button-text", settings.button_text_color || "#ffffff");
    set("--btn-radius", radiusFor(settings.button_style));

    // Google Fonts
    let fontLink: HTMLLinkElement | null = null;
    if (settings.font_family) {
      const family = settings.font_family.replace(/ /g, "+");
      fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
      fontLink.dataset.checkoutFont = "1";
      document.head.appendChild(fontLink);
      root.style.setProperty("--checkout-font", `'${settings.font_family}', system-ui, sans-serif`);
    } else {
      root.style.setProperty("--checkout-font", "system-ui, sans-serif");
    }

    // Custom CSS
    let styleTag: HTMLStyleElement | null = null;
    if (settings.custom_css) {
      styleTag = document.createElement("style");
      styleTag.dataset.checkoutCustom = "1";
      styleTag.textContent = settings.custom_css;
      document.head.appendChild(styleTag);
    }

    return () => {
      fontLink?.remove();
      styleTag?.remove();
    };
  }, [settings]);

  useEffect(() => {
    if (!product?.countdown_minutes) return;
    const total = product.countdown_minutes * 60;
    const id = setInterval(() => setSecondsLeft(s => s <= 1 ? total : s - 1), 1000);
    return () => clearInterval(id);
  }, [product?.countdown_minutes]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (notFound || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <h1 className="text-3xl font-bold">Product not available</h1>
        <p className="mt-3 text-gray-600">This checkout link is not active.</p>
        <a href="https://checkouthubs.com" className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-white">Visit CheckoutHubs</a>
      </div>
    );
  }

  // Country pricing override → fallback to product
  const ovActive = !!(override && override.active);
  const p1 = ovActive && override!.price_1 != null ? Number(override!.price_1) : Number(product.price_1);
  const p2 = ovActive && override!.price_2 != null ? Number(override!.price_2) : Number(product.price_2);
  const p3 = ovActive && override!.price_3 != null ? Number(override!.price_3) : Number(product.price_3);
  const bumpPriceEff = ovActive && override!.bump_price != null ? Number(override!.bump_price) : Number(product.bump_price || 0);

  const variantPrice = variant === 1 ? p1 : variant === 2 ? p2 : variant === 3 ? p3 : Number(product.price_4);
  const variantLabel = variant === 1 ? product.label_1 : variant === 2 ? product.label_2 : variant === 3 ? product.label_3 : product.label_4;
  const bumpPrice = bump && product.bump_enabled ? bumpPriceEff : 0;
  const subtotal = variantPrice + bumpPrice;
  let discountAmount = 0;
  if (discount?.valid) {
    if (discount.percent) discountAmount = (subtotal * discount.percent) / 100;
    else if (discount.amount) discountAmount = discount.amount;
  }
  const total = Math.max(0, subtotal - discountAmount);

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const applyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    const { data: rows } = await supabase.rpc("validate_discount_code", { _code: code });
    const data = Array.isArray(rows) ? rows[0] : null;
    if (!data) { setDiscount({ code, valid: false, message: "Code not found" }); return; }
    const isPercent = data.discount_type === "percent" || data.discount_type === "percentage";
    setDiscount({
      code,
      valid: true,
      percent: isPercent ? Number(data.discount_value) : undefined,
      amount: !isPercent ? Number(data.discount_value) : undefined,
      message: isPercent ? `${data.discount_value}% off applied` : `${curr.symbol}${data.discount_value} off applied`,
    });
  };

  const validate = () => {
    const req: (keyof typeof form)[] = ["customer_name","email","phone","address_line1","city","postcode"];
    const e: Record<string, boolean> = {};
    req.forEach(k => { if (!form[k].trim()) e[k] = true; });
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = true;
    const colorsArr = Array.isArray(product?.colors) ? product!.colors!.filter(c => c && (c.name || c.hex)) : [];
    if (colorsArr.length > 0 && !selectedColor) {
      alert("Please choose a color before checking out.");
      return false;
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("orders").insert({
      customer_name: form.customer_name,
      email: form.email,
      phone: `${DIAL_FOR(country)} ${form.phone}`.trim(),
      address_line1: form.address_line1,
      address_line2: form.address_line2 || null,
      city: form.city,
      postcode: form.postcode,
      country,
      country_code: countryCode,
      product_id: product.id,
      product_name: product.product_name,
      variant_label: selectedColor ? `${variantLabel ?? ""} — ${selectedColor}` : variantLabel,
      quantity: 1,
      subtotal,
      bump_added: bump,
      bump_name: bump ? product.bump_text : null,
      bump_price: bump ? bumpPrice : 0,
      discount_code: discount?.valid ? discount.code : null,
      discount_amount: discountAmount,
      total,
      currency: curr.code,
      payment_method: "card",
      payment_status: "pending",
      order_status: "pending",
      source_domain: `${window.location.hostname}${window.location.pathname}`,
    }).select("id, order_number").single();

    setSubmitting(false);
    if (error || !data) { alert(`Could not place order: ${error?.message ?? "Unknown error"}`); return; }
    if (product.upsell_enabled) {
      window.location.href = `/upsell?order_id=${data.id}`;
    } else {
      window.location.href = `/thank-you?order=${data.order_number}`;
    }
  };

  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inputCls = (k: string) => `mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${errors[k] ? "border-red-500" : "border-gray-300"}`;

  const variants = [
    { id: 1, label: product.label_1, price: Number(product.price_1) },
    { id: 2, label: product.label_2, price: Number(product.price_2), popular: true },
    { id: 3, label: product.label_3, price: Number(product.price_3) },
    ...(Number(product.price_4) > 0 ? [{ id: 4, label: product.label_4, price: Number(product.price_4) }] : []),
  ];
  const productColors = Array.isArray(product.colors) ? product.colors.filter(c => c && (c.name || c.hex)) : [];
  const hasColors = productColors.length > 0;
  const unit1 = Number(product.price_1);

  // ====== Shared building blocks ======

  const BundleSelector = ({ stacked = false }: { stacked?: boolean }) => (
    <div className={stacked ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}>
      {variants.map(v => {
        const active = variant === v.id;
        const savings = v.id === 3 && unit1 ? Math.round(((unit1 * 3 - v.price) / (unit1 * 3)) * 100) : 0;
        return (
          <button
            key={v.id}
            onClick={() => setVariant(v.id)}
            className="relative border-2 p-4 text-left transition"
            style={{
              borderColor: active ? "var(--brand-color)" : "#e5e7eb",
              backgroundColor: active ? "color-mix(in oklab, var(--brand-color) 8%, white)" : "white",
              borderRadius: "var(--btn-radius)",
            }}
          >
            {v.popular ? (
              <span className="absolute -top-2 left-2 rounded px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "var(--brand-color)", color: "var(--button-text)" }}>Most Popular</span>
            ) : null}
            <div className="text-sm font-semibold" style={{ color: "var(--headline-color)" }}>{v.label}</div>
            <div className="mt-1 text-lg font-bold" style={{ color: "var(--headline-color)" }}>{fmt(curr.symbol, v.price)}</div>
            {savings > 0 ? <div className="mt-1 text-xs text-green-700">Save {savings}%</div> : null}
          </button>
        );
      })}
    </div>
  );

  const FormFields = () => (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2" data-field="customer_name">
        <label className="text-sm font-bold text-gray-900">Full Name</label>
        <input value={form.customer_name} onChange={e => setF("customer_name", e.target.value)} className={inputCls("customer_name")} />
      </div>
      <div data-field="email">
        <label className="text-sm font-bold text-gray-900">Email Address</label>
        <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} className={inputCls("email")} />
      </div>
      <div data-field="phone">
        <label className="text-sm font-bold text-gray-900">Phone Number</label>
        <div className="mt-1 flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">{DIAL_FOR(country)}</span>
          <input value={form.phone} onChange={e => setF("phone", e.target.value)} className={`w-full rounded-r-md border px-3 py-2 text-sm outline-none focus:ring-2 ${errors.phone ? "border-red-500" : "border-gray-300"}`} />
        </div>
      </div>
      <div className="sm:col-span-2" data-field="address_line1">
        <label className="text-sm font-bold text-gray-900">Address Line 1</label>
        <input value={form.address_line1} onChange={e => setF("address_line1", e.target.value)} className={inputCls("address_line1")} />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-bold text-gray-900">Address Line 2 <span className="text-gray-400">(optional)</span></label>
        <input value={form.address_line2} onChange={e => setF("address_line2", e.target.value)} className={inputCls("address_line2")} />
      </div>
      <div data-field="city">
        <label className="text-sm font-bold text-gray-900">City</label>
        <input value={form.city} onChange={e => setF("city", e.target.value)} className={inputCls("city")} />
      </div>
      <div data-field="postcode">
        <label className="text-sm font-bold text-gray-900">{countryCfg.postcode_label}</label>
        <input value={form.postcode} onChange={e => setF("postcode", e.target.value)} className={inputCls("postcode")} />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-bold text-gray-900">Country</label>
        <select value={country} onChange={e => setCountry(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
          {SUPPORTED_COUNTRIES.map((code) => (
            <option key={code} value={COUNTRIES[code].iso}>{COUNTRIES[code].flag} {COUNTRIES[code].name}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const DiscountBox = () => (
    <div className="mt-6">
      {!showDiscount ? (
        <button onClick={() => setShowDiscount(true)} className="text-sm underline" style={{ color: "var(--brand-color)" }}>Have a discount code?</button>
      ) : (
        <div>
          <div className="flex gap-2">
            <input value={discountInput} onChange={e => setDiscountInput(e.target.value)} placeholder="Enter code" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button onClick={applyDiscount} className="px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#111827", color: "#fff", borderRadius: "var(--btn-radius)" }}>Apply</button>
          </div>
          {discount ? (
            <p className={`mt-2 text-sm ${discount.valid ? "text-green-700" : "text-red-600"}`}>{discount.message}</p>
          ) : null}
        </div>
      )}
    </div>
  );

  const BumpBox = () => product.bump_enabled ? (
    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border-2 border-dashed border-yellow-400 bg-yellow-50 p-4">
      <input type="checkbox" checked={bump} onChange={e => setBump(e.target.checked)} className="mt-1 h-4 w-4" />
      <div className="flex-1">
        <div className="font-semibold" style={{ color: "var(--headline-color)" }}>{product.bump_text}</div>
        <div className="text-sm" style={{ color: "var(--text-color)" }}>Add for just +{fmt(curr.symbol, Number(product.bump_price || 0))}</div>
      </div>
    </label>
  ) : null;

  const OrderSummaryRows = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span>{variantLabel}</span><span>{fmt(curr.symbol, variantPrice)}</span></div>
      {bump && product.bump_enabled ? (
        <div className="flex justify-between"><span>{product.bump_text}</span><span>{fmt(curr.symbol, bumpPrice)}</span></div>
      ) : null}
      {discount?.valid ? (
        <div className="flex justify-between text-green-700"><span>Discount ({discount.code})</span><span>-{fmt(curr.symbol, discountAmount)}</span></div>
      ) : null}
      <div className="flex justify-between border-t pt-2 text-gray-600"><span>Subtotal</span><span>{fmt(curr.symbol, subtotal)}</span></div>
      <div className="flex justify-between text-xl font-bold" style={{ color: "var(--headline-color)" }}><span>Total</span><span>{fmt(curr.symbol, total)}</span></div>
    </div>
  );

  const PayButtons = () => (
    <>
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-5 w-full py-3 text-base font-semibold disabled:opacity-60"
        style={{ backgroundColor: "var(--button-color)", color: "var(--button-text)", borderRadius: "var(--btn-radius)" }}
      >
        {submitting ? "Processing…" : "Pay with Card →"}
      </button>
      <div className="my-3 text-center text-xs text-gray-500">or pay with</div>
      <button className="w-full bg-yellow-400 py-3 text-sm font-bold text-blue-900 hover:bg-yellow-300"
        style={{ borderRadius: "var(--btn-radius)" }}>
        PayPal
      </button>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
        <div>🔒<div>SSL Secured</div></div>
        <div>↩<div>30-Day Money Back</div></div>
        <div>🚚<div>Fast Tracked Shipping</div></div>
      </div>
    </>
  );

  const switchCountry = (code: CountryCode) => {
    if (code === countryCode) { setCountryMenuOpen(false); return; }
    const params = new URLSearchParams(window.location.search);
    if (params.has("country")) {
      params.set("country", code);
      window.location.href = `${window.location.pathname}?${params.toString()}`;
    } else {
      window.location.href = `/${code}${window.location.search}`;
    }
  };

  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("subdomain");

  const CountrySwitcher = () => countryFixed ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm">
      <span className="text-base leading-none">{countryCfg.flag}</span>
      <span className="hidden sm:inline">{countryCfg.name}</span>
      <span className="sm:hidden">{countryCfg.code.toUpperCase()}</span>
    </div>
  ) : (
    <div className="relative">
      <button
        type="button"
        onClick={() => setCountryMenuOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1.5 text-sm hover:bg-white/25"
      >
        <span className="text-base leading-none">{countryCfg.flag}</span>
        <span className="hidden sm:inline">{countryCfg.name}</span>
        <span className="sm:hidden">{countryCfg.code.toUpperCase()}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>
      {countryMenuOpen ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setCountryMenuOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg">
            {SUPPORTED_COUNTRIES.map((code) => {
              const c = COUNTRIES[code];
              const active = code === countryCode;
              return (
                <button
                  key={code}
                  onClick={() => switchCountry(code)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${active ? "bg-gray-100 font-semibold" : ""}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span>{c.name}</span>
                  {active ? <span className="ml-auto text-xs text-green-600">✓</span> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );

  const TopBars = () => (
    <>
      {isPreview ? (
        <div className="bg-yellow-300 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-yellow-900">
          Preview — {subdomain} — {countryCfg.flag} {countryCfg.code.toUpperCase()} — Template {settings?.template_id ?? 1}
        </div>
      ) : null}
      <div className="bg-gradient-to-r from-amber-700 via-rose-700 to-indigo-800 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-sm sm:text-sm sm:tracking-[0.2em]">
        🏷 Special Limited Time Offer · Up To 75% Off
      </div>
      <header style={{ backgroundColor: "var(--brand-color)", color: "var(--button-text)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={product.product_name} className="h-8" />
          ) : (
            <div className="text-lg font-bold">{product.product_name}</div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline-flex items-center gap-1"><span aria-hidden>🔒</span> SSL Secured</span>
            <CountrySwitcher />
          </div>
        </div>
      </header>
      {product.countdown_minutes && product.countdown_minutes > 0 ? (
        <div className="bg-red-600 py-2 text-center text-sm font-medium text-white">
          Special offer ends in: {hh}:{mm}:{ss}
        </div>
      ) : null}
    </>
  );

  const Shell = ({ children }: { children: ReactNode }) => (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontFamily: "var(--checkout-font)" }}>
      <TopBars />
      {children}
      <footer className="mt-12 border-t bg-white py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {product.product_name}. Secure checkout powered by CheckoutHubs.
      </footer>
    </div>
  );

  const templateId = settings?.template_id ?? 1;

  // ============ TEMPLATE 4 — Water Flosser (premium conversion) ============
  if (templateId === 4) {
    const stockMax = product.stock_count && product.stock_count > 0 ? Math.max(product.stock_count, 100) : 100;
    const stockNow = product.stock_count ?? 95;
    const stockPct = Math.min(100, Math.max(8, Math.round((stockNow / stockMax) * 100)));
    const discounts = [60, 65, 70, 75];

    const defaultReviews = [
      { name: "James T.",     title: "Remarkable Plaque Removal",    text: "I've been using this water flosser for over a month, and the difference is incredible. Removes plaque so effectively that my teeth feel cleaner than ever!" },
      { name: "Emily R.",     title: "Excellent For Sensitive Gums", text: "Traditional flossing always irritated my sensitive gums. This flosser was my salvation — gentle yet thorough, making my gums healthier without any discomfort." },
      { name: "Michelle S.",  title: "Super Easy to Use",            text: "I was skeptical at first, but this water flosser has really blown me away! It's so easy to use and it's much quicker than regular flossing." },
      { name: "Steven L.",    title: "Perfect Addition to My Routine", text: "Adding this to my daily routine has been amazing. It's quick, efficient, and leaves my mouth feeling fresh and clean every time." },
      { name: "Kelly M.",     title: "Exceeded Expectations",        text: "After switching to this water flosser I noticed how much cleaner my teeth and gums are, and it even improved my breath. Highly recommend!" },
    ];
    const reviews = (product.reviews && product.reviews.length > 0) ? product.reviews : defaultReviews;

    const defaultWhy = [
      { icon: "👥", title: "Over 75,000+ Happy Customers", body: "Loved by tens of thousands who say it's a must-have." },
      { icon: "💬", title: "Professional Customer Support", body: "Got any questions? Our customer service team works 24/7 for your satisfaction." },
      { icon: "🦷", title: "Cleaner & Healthier Teeth", body: "Designed to deeply clean — healthier gums, fresher breath." },
    ];
    const whyItems = (product.why_choose_items && product.why_choose_items.length > 0) ? product.why_choose_items : defaultWhy;
    const whyTitle = product.why_choose_title || `Why Choose ${product.product_name}`;
    const reviewsTitle = product.reviews_title || "Over 3,000 5-Star Reviews";

    const BundleCardWF = () => (
      <div className="space-y-4">
        {variants.map((v, idx) => {
          const active = variant === v.id;
          const discount = discounts[idx] ?? 60;
          const original = v.id === 1 ? unit1 * 2.5 : unit1 * v.id / (1 - discount / 100);
          const each = v.price / v.id;
          const qty = v.id;
          const intPart = Math.floor(each);
          const decPart = (each % 1).toFixed(2).slice(2);
          return (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className="relative w-full overflow-hidden rounded-2xl border-2 text-left transition hover:shadow-lg"
              style={{
                borderColor: active ? "var(--brand-color)" : "#e5e7eb",
                backgroundColor: active ? "color-mix(in oklab, var(--brand-color) 5%, white)" : "white",
                boxShadow: active ? "0 10px 30px -12px color-mix(in oklab, var(--brand-color) 35%, transparent)" : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-stretch gap-3 p-4 sm:gap-5 sm:p-5">
                {/* radio */}
                <div className="flex items-center">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: active ? "var(--brand-color)" : "#cbd5e1" }}>
                    {active ? <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--brand-color)" }} /> : null}
                  </div>
                </div>
                {/* image */}
                {(product.checkout_image_url || product.image_url) ? (
                  <img src={product.checkout_image_url || product.image_url || ""} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-white object-contain sm:h-24 sm:w-24" />
                ) : (
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100 sm:h-24 sm:w-24" />
                )}
                {/* qty + label */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black leading-none tracking-tight sm:text-4xl" style={{ color: "var(--headline-color)" }}>{qty}x</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-sans text-black font-bold sm:text-lg">{v.label ?? product.product_name}</div>
                </div>
                {/* divider + discount pill */}
                <div className="hidden items-center sm:flex">
                  <div className="mx-2 h-16 w-px bg-gray-200" />
                  <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1 text-base font-extrabold" style={{ color: "var(--headline-color)" }}>
                      <span className="text-sm">🏷</span> {discount}%
                    </div>
                  </div>
                  <div className="mx-2 h-16 w-px bg-gray-200" />
                </div>
                {/* price */}
                <div className="flex flex-col items-end justify-center text-right">
                  <div className="text-xs font-medium text-gray-400 line-through sm:text-sm">{fmt(curr.symbol, original)}</div>
                  <div className="flex items-start leading-none" style={{ color: "var(--headline-color)" }}>
                    <span className="mt-1 text-lg font-bold sm:text-xl">{curr.symbol}</span>
                    <span className="text-4xl font-black tracking-tight sm:text-5xl">{intPart}</span>
                    <span className="ml-0.5 flex flex-col items-start">
                      <span className="text-sm font-extrabold leading-none sm:text-base">.{decPart}</span>
                      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">each</span>
                    </span>
                  </div>
                  {v.popular ? (
                    <div className="mt-2 inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-900 shadow-sm" style={{ backgroundColor: "#fbbf24" }}>
                      Best Seller
                    </div>
                  ) : null}
                </div>
              </div>
              {/* mobile discount row */}
              <div className="flex items-center justify-center border-t border-dashed border-gray-200 bg-gray-50/60 px-4 py-1.5 text-xs font-bold sm:hidden" style={{ color: "var(--headline-color)" }}>
                <span className="mr-1">🏷</span> Save {discount}%
              </div>
            </button>
          );
        })}
      </div>
    );

    return (
      <Shell>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* LEFT — checkout column */}
            <div className="space-y-5">
              {/* Stock bar */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-semibold" style={{ color: "var(--headline-color)" }}>
                  <span>Only <span className="text-red-600">5 items</span></span>
                  <span>Left in Stock!</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${stockPct}%`, background: "linear-gradient(90deg,#facc15,#f97316,#ef4444)" }} />
                </div>
              </div>



              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500" />
                <div className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500">★ As Featured In ★</div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 opacity-80">
                  <span className="font-serif text-2xl font-black italic tracking-tight text-gray-900">Forbes</span>
                  <span className="rounded-sm bg-gray-900 px-2 py-1 text-sm font-black tracking-[0.2em] text-white">BBC</span>
                  <span className="rounded-sm bg-red-600 px-2 py-1 text-sm font-black tracking-[0.2em] text-white">CNN</span>
                  <span className="text-base font-black text-emerald-600">TechCrunch</span>
                  <span className="font-serif text-base font-bold italic text-gray-900">The Guardian</span>
                  <span className="text-base font-black uppercase tracking-tight text-gray-900">MASHABLE</span>
                </div>
              </div>


              <section>
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--headline-color)" }}>Choose Your Package</h2>
                <div className="mt-4"><BundleCardWF /></div>
              </section>

              {hasColors ? (
                <section className="rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm" style={{ borderColor: "color-mix(in oklab, var(--brand-color) 25%, #e5e7eb)" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold" style={{ color: "var(--headline-color)" }}>Choose Your Color</h3>
                    {selectedColor ? (
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: "var(--brand-color)" }}>{selectedColor}</span>
                    ) : (
                      <span className="text-xs font-semibold text-red-500">* Required</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {productColors.map((c, i) => {
                      const isActive = selectedColor === (c.name || c.hex);
                      return (
                        <button
                          key={`${c.name ?? c.hex ?? i}`}
                          type="button"
                          onClick={() => setSelectedColor(c.name || c.hex || "")}
                          className="group flex flex-col items-center gap-1.5"
                        >
                          <span
                            className="relative flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-offset-2 transition-transform group-hover:scale-110"
                            style={{
                              backgroundColor: c.hex || "#e5e7eb",
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                              ...(isActive
                                ? { ['--tw-ring-color' as any]: "var(--brand-color)" }
                                : { ['--tw-ring-color' as any]: "transparent" }),
                            }}
                          >
                            {isActive ? <span className="text-lg font-black text-white drop-shadow">✓</span> : null}
                          </span>
                          <span className={`text-[11px] font-semibold ${isActive ? "" : "text-gray-600"}`} style={isActive ? { color: "var(--brand-color)" } : undefined}>{c.name || c.hex}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <BumpBox />

              {/* Express checkout */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-center text-xs font-medium text-gray-500">Express checkout</div>
                <button className="mt-2 flex w-full items-center justify-center rounded-md bg-[#ffc439] py-3 font-bold text-[#003087] hover:bg-yellow-300">
                  <span className="mr-1 text-lg">𝐏</span>PayPal
                </button>
                <div className="mt-2 text-center text-xs text-gray-500">Or continue to pay with credit card</div>
              </div>

              {/* Payment methods */}
              <section className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="text-2xl font-extrabold text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-500">All transactions are secure encrypted.</p>
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <div className="flex items-center justify-between border-b bg-blue-50/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border-2" style={{ borderColor: "var(--brand-color)" }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-color)" }} />
                      </span>
                      Credit Card
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">VISA</span>
                      <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">MC</span>
                      <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">AMEX</span>
                      <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">+4</span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="relative">
                      <input placeholder="Card Number" className="w-full rounded-md border border-gray-300 px-3 py-3 pr-10 text-sm" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Expiration (MM/YY)" className="rounded-md border border-gray-300 px-3 py-3 text-sm" />
                      <div className="relative">
                        <input placeholder="CVV/CVC" className="w-full rounded-md border border-gray-300 px-3 py-3 pr-10 text-sm" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">?</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <span className="h-4 w-4 rounded-full border-2 border-gray-300" /> PayPal
                    </div>
                    <span className="font-bold text-[#003087]">𝐏 PayPal</span>
                  </div>
                </div>
              </section>


              {/* Customer Info */}
              <section className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="text-2xl font-extrabold text-gray-900">Customer Information</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div data-field="customer_name">
                    <input
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); setF("customer_name", `${e.target.value} ${lastName}`.trim()); }}
                      className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.customer_name ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => { setLastName(e.target.value); setF("customer_name", `${firstName} ${e.target.value}`.trim()); }}
                      className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2"
                    />
                  </div>
                  <div className="sm:col-span-2" data-field="email">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={e => setF("email", e.target.value)}
                      className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  <div className="sm:col-span-2" data-field="phone">
                    <label className="text-sm font-bold text-gray-900">Phone Number <span className="font-normal text-gray-500">(Optional)</span></label>
                    <div className="mt-1 flex">
                      <span className="inline-flex items-center gap-1 rounded-l-md border border-r-0 border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
                        <span className="inline-block h-3 w-4 rounded-sm bg-gradient-to-b from-green-700 via-white to-green-700" />
                        {DIAL_FOR(country)}
                      </span>
                      <input
                        placeholder="301 2345678"
                        value={form.phone}
                        onChange={e => setF("phone", e.target.value)}
                        className="w-full rounded-r-md border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Delivery Address */}
              <section className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="text-2xl font-extrabold text-gray-900">Delivery Address</h3>
                <div className="mt-4 grid gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-700">Country</span>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900"
                    >
                      {SUPPORTED_COUNTRIES.map((code) => (
                        <option key={code} value={COUNTRIES[code].iso}>{COUNTRIES[code].flag} {COUNTRIES[code].name}</option>
                      ))}
                    </select>
                  </label>
                  <div data-field="address_line1">
                    <input
                      placeholder="Address"
                      value={form.address_line1}
                      onChange={e => setF("address_line1", e.target.value)}
                      className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.address_line1 ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div data-field="city">
                      <input
                        placeholder="City"
                        value={form.city}
                        onChange={e => setF("city", e.target.value)}
                        className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.city ? "border-red-500" : "border-gray-300"}`}
                      />
                    </div>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">State</span>
                      <input
                        placeholder="State"
                        value={stateRegion}
                        onChange={e => setStateRegion(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </label>
                    <div data-field="postcode">
                      <input
                        placeholder={countryCfg.postcode_label}
                        value={form.postcode}
                        onChange={e => setF("postcode", e.target.value)}
                        className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.postcode ? "border-red-500" : "border-gray-300"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Trust strip */}
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-100 p-4 text-center text-xs font-bold text-gray-800 sm:grid-cols-4">
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">🔒</span>SSL Secured</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">🛡</span>256-bit Encryption</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">✓</span>30-Day Money Back Guarantee</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">🔐</span>Secure Checkout</div>
                </div>

                <DiscountBox />

                <p className="mt-5 text-center text-sm font-semibold text-red-600">
                  ⚡ Your 75% discount expires soon — complete your order now to lock in this price
                </p>

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md py-4 text-base font-bold text-white shadow-md disabled:opacity-60"
                  style={{ backgroundColor: "var(--button-color)", color: "var(--button-text)" }}
                >
                  <span>🔒</span>
                  {submitting ? "Processing…" : `Yes! Send My ${product.product_name} Now →`}
                </button>
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-gray-500">
                  <span>Terms & Conditions</span><span>Privacy Policy</span><span>Refund Policy</span><span>Shipping Policy</span><span>Contact us</span>
                </div>
              </section>

            </div>

            {/* RIGHT — sticky trust panel */}
            <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">

              <div className="rounded-xl border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setSummaryOpen(o => !o)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  aria-expanded={summaryOpen}
                >
                  <h3 className="text-base font-bold" style={{ color: "var(--headline-color)" }}>Order Summary</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold" style={{ color: "var(--headline-color)" }}>{fmt(curr.symbol, total)}</span>
                    <span className="text-gray-400 transition-transform" style={{ transform: summaryOpen ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                </button>
                {summaryOpen ? (
                  <div className="border-t px-5 py-4"><OrderSummaryRows /></div>
                ) : null}
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">— {whyTitle} —</div>
                <div className="space-y-4">
                  {whyItems.map((b, i) => (
                    <div key={`${b.title ?? ""}-${i}`} className="flex gap-3">
                      <div className="text-2xl">{b.icon || "✅"}</div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--headline-color)" }}>{b.title}</div>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-color)" }}>{b.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500">— {reviewsTitle} —</div>
                <div className="mt-4 space-y-3">
                  {reviews.map((r, i) => (
                    <article key={`${r.name ?? ""}-${i}`} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <span className="rounded bg-emerald-500 px-1 text-[10px] font-bold text-white">★★★★★</span>
                          <span className="text-xs font-semibold text-gray-700">{r.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600">Verified Buyer</span>
                      </div>
                      <div className="mt-1.5 text-sm font-bold" style={{ color: "var(--headline-color)" }}>{r.title}</div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{r.text}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-white p-5 text-center shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">As Featured In</div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <span className="font-serif text-lg font-black italic tracking-tight text-gray-800">Forbes</span>
                  <span className="rounded-sm bg-gray-900 px-1.5 py-0.5 text-[11px] font-black tracking-widest text-white">BBC</span>
                  <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[11px] font-black tracking-widest text-white">CNN</span>
                  <span className="font-sans text-sm font-black text-emerald-600">TechCrunch</span>
                  <span className="font-serif text-sm font-bold italic text-gray-800">The Guardian</span>
                  <span className="font-sans text-sm font-black uppercase tracking-tight text-gray-800">MASHABLE</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Shell>
    );
  }

  // ============ TEMPLATE 2 — Hero ============
  if (templateId === 2) {
    return (
      <Shell>
        <section
          className="relative w-full"
          style={{
            backgroundImage: product.image_url ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)), url(${product.image_url})` : undefined,
            backgroundColor: product.image_url ? undefined : "var(--brand-color)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "380px",
          }}
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20 text-center text-white">
            <h1 className="text-4xl font-bold sm:text-5xl">{product.headline || product.product_name}</h1>
            {product.subheadline ? <p className="mt-4 max-w-2xl text-lg opacity-95">{product.subheadline}</p> : null}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-yellow-300">★★★★★</span>
              <span>4.8/5 (2,847 reviews)</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-4 py-10">
          <h2 className="text-center text-xl font-bold" style={{ color: "var(--headline-color)" }}>Choose your bundle</h2>
          <div className="mt-4"><BundleSelector /></div>

          <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold" style={{ color: "var(--headline-color)" }}>Shipping & Contact</h2>
            <FormFields />
            <DiscountBox />
            <BumpBox />
            <div className="mt-6 border-t pt-4">
              <OrderSummaryRows />
            </div>
            <PayButtons />
          </div>
        </div>
      </Shell>
    );
  }

  // ============ TEMPLATE 3 — Minimal ============
  if (templateId === 3) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={product.product_name} className="mx-auto h-10" />
          ) : null}
          <h1 className="mt-6 text-3xl font-bold" style={{ color: "var(--headline-color)" }}>{product.headline || product.product_name}</h1>
          {product.subheadline ? <p className="mt-2" style={{ color: "var(--text-color)" }}>{product.subheadline}</p> : null}

          <div className="mt-8 text-left"><BundleSelector stacked /></div>

          <div className="mt-8 rounded-lg border bg-white p-6 text-left shadow-sm">
            <h2 className="text-lg font-bold" style={{ color: "var(--headline-color)" }}>Your details</h2>
            <FormFields />
            <DiscountBox />
            <BumpBox />

            <div className="mt-6 rounded-md border">
              <button
                type="button"
                onClick={() => setSummaryOpen(o => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>Order summary · {fmt(curr.symbol, total)}</span>
                <span>{summaryOpen ? "▴" : "▾"}</span>
              </button>
              {summaryOpen ? <div className="border-t p-4"><OrderSummaryRows /></div> : null}
            </div>

            <PayButtons />
          </div>
        </div>
      </Shell>
    );
  }

  // ============ TEMPLATE 1 — Standard (default) ============
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="grid gap-8 md:grid-cols-[45%_1fr]">
          <div>
            {product.image_url ? (
              <img src={product.image_url} alt={product.product_name} className="w-full rounded-lg border" />
            ) : (
              <div className="aspect-square w-full rounded-lg bg-gray-200" />
            )}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-yellow-500">★★★★★</span>
              <span style={{ color: "var(--text-color)" }}>4.8/5 (2,847 reviews)</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs" style={{ color: "var(--text-color)" }}>
              <div className="rounded-md border bg-white p-3">🔒<div className="mt-1">SSL Secured</div></div>
              <div className="rounded-md border bg-white p-3">↩<div className="mt-1">30-Day Refund</div></div>
              <div className="rounded-md border bg-white p-3">🚚<div className="mt-1">Fast Shipping</div></div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--headline-color)" }}>{product.headline || product.product_name}</h1>
            {product.subheadline ? <p className="mt-2" style={{ color: "var(--text-color)" }}>{product.subheadline}</p> : null}
            <div className="mt-6"><BundleSelector /></div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--headline-color)" }}>Shipping & Contact</h2>
                <FormFields />
                <DiscountBox />
                <BumpBox />
              </div>
              <aside className="lg:sticky lg:top-4 lg:self-start">
                <div className="rounded-lg border bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold" style={{ color: "var(--headline-color)" }}>Order Summary</h3>
                  <div className="mt-3"><OrderSummaryRows /></div>
                  <PayButtons />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
