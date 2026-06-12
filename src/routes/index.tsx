import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { isCountryCode, mapIsoToCode, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";
import { SiteLayout } from "@/components/site-layout";
import { CheckoutPage } from "@/components/checkout-page";
import { useDomain } from "@/contexts/DomainContext";
import { MAIN_DOMAIN } from "@/lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "checkoutculture — Quality Products, Fast UK Delivery" },
      { name: "description", content: "Trusted UK e-commerce store offering quality products with fast delivery and secure checkout." },
      { property: "og:title", content: "checkoutculture — Quality Products, Fast UK Delivery" },
      { property: "og:description", content: "Trusted UK e-commerce store offering quality products with fast delivery and secure checkout." },
    ],
  }),
  component: RootRouter,
});

const CARD_PASTELS = ["#FCEAE8","#EAE6F8","#E0EDF8","#DFF0E8","#F5E0EE","#F8F0DC","#E8F0E8","#F0E8F4"];
const MARQUEE_TRUST = ["2-YEAR WARRANTY INCLUDED","WORLDWIDE DELIVERY","SAME-DAY DISPATCH BEFORE 3PM","VERIFIED-MERCHANT PROGRAM","FREE SHIPPING OVER £40","30-DAY MONEY-BACK"];
const CATEGORIES = ["All","Wellness","Recovery","Tech","Home","Beauty","Fitness","Audio"];

function RootRouter() {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [countryResolved, setCountryResolved] = useState(false);
  const [countryFixed, setCountryFixed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const previewSub = params.get("subdomain");
    const previewCountry = params.get("country");

    let detectedSub: string | null = null;
    if (previewSub) {
      detectedSub = previewSub;
    } else {
      const isMainStoreHostname =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "checkouthub.com" ||
        hostname === "www.checkouthub.com" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovableproject.com") ||
        hostname.endsWith(".vercel.app");
      if (!isMainStoreHostname && hostname.includes(".")) {
        const sub = hostname.split(".")[0];
        if (sub && sub !== "www") detectedSub = sub;
      }
    }

    if (!detectedSub) return;
    setSubdomain(detectedSub);

    // Never rewrite the URL path — TanStack Router would try to match /uk as
    // a route, find nothing, and show 404. Country is tracked in state only.
    const isPreviewMode = true;

    // Country resolution: preview param > url path > ip geolocate
    if (previewCountry && isCountryCode(previewCountry)) {
      setCountryCode(previewCountry);
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    const firstSeg = window.location.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    if (isCountryCode(firstSeg)) {
      setCountryCode(firstSeg);
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    if (firstSeg && !isCountryCode(firstSeg) && SUPPORTED_COUNTRIES.length > 0) {
      if (!isPreviewMode) window.history.replaceState(null, "", `/uk${window.location.search}`);
      setCountryCode("uk");
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    // Empty path — auto-detect via IP (country not fixed, show dropdown)
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        const code = mapIsoToCode(d?.country_code);
        if (!isPreviewMode) window.history.replaceState(null, "", `/${code}${window.location.search}`);
        setCountryCode(code);
        setCountryFixed(false);
        setCountryResolved(true);
      })
      .catch(() => {
        if (!isPreviewMode) window.history.replaceState(null, "", `/uk${window.location.search}`);
        setCountryCode("uk");
        setCountryFixed(false);
        setCountryResolved(true);
      });
  }, []);

  if (subdomain) {
    if (!countryResolved || !countryCode) {
      return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
    }
    return <CheckoutPage subdomain={subdomain} countryCode={countryCode} countryFixed={countryFixed} />;
  }




  return <MainStore />;
}

type Product = Tables<"products">;

function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : initialSeconds)), 1000);
    return () => clearInterval(t);
  }, [initialSeconds]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MainStore() {
  const { company_name, rootDomain } = useDomain();
  const { addItem, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const countdown = useCountdown(9589);

  useEffect(() => {
    const load = async () => {
      const domain = rootDomain || MAIN_DOMAIN;
      const isMain = domain === MAIN_DOMAIN;
      const filter = isMain ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null` : `root_domain.eq.${domain}`;
      const { data, error } = await (supabase.from("products").select("*").neq("active", false) as any)
        .or(filter).order("created_at", { ascending: false });
      if (!error) { setProducts((data ?? []) as Product[]); return; }
      const { data: fb } = await supabase.from("products").select("*").neq("active", false).order("created_at", { ascending: false });
      setProducts((fb ?? []) as Product[]);
    };
    load();
  }, [rootDomain]);

  const handleAdd = (p: Product) => {
    const v = p.default_variant ?? 2;
    const price = v === 1 ? Number(p.price_1) : v === 3 ? Number(p.price_3) : Number(p.price_2);
    const label = v === 1 ? (p.label_1 ?? "Single") : v === 3 ? (p.label_3 ?? "Bulk") : (p.label_2 ?? "Bundle");
    addItem({ product_id: p.id, subdomain: p.subdomain, product_name: p.product_name, image_url: p.image_url ?? "", variant_label: label, unit_price: price, quantity: 1 });
    openCart();
  };

  const submitNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await supabase.from("newsletter_signups" as any).insert({ email: email.trim(), root_domain: rootDomain });
    setNewsletterSent(true);
    setEmail("");
  };

  const shelfProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <SiteLayout>
      <style>{`
        :root {
          --co-bg: #FAF7F0;
          --co-ink: #1A1A1A;
          --co-ink-2: #555;
          --co-ink-3: #999;
          --co-yellow: #F5C242;
          --co-hair: #E8E4DC;
          --co-surface: #fff;
          --co-serif: 'Instrument Serif', Georgia, serif;
        }
        body, .ch-store { background: var(--co-bg) !important; }
        @keyframes co-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .co-marquee { animation: co-marquee 28s linear infinite; display: flex; gap: 0; white-space: nowrap; }
        .co-card:hover .co-checkout-btn { opacity: 1 !important; transform: translateY(0) !important; }
        .co-pill-btn { background: #1A1A1A; color: #fff; border-radius: 999px; padding: 14px 24px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background .2s; }
        .co-pill-btn:hover { background: #333; }
        .co-pill-btn.yellow { background: var(--co-yellow); color: #1A1A1A; }
        .co-pill-btn.yellow:hover { background: #e0b030; }
        .co-cat-pill { background: transparent; border: 1px solid var(--co-hair); border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--co-ink-2); transition: all .15s; }
        .co-cat-pill.active { background: var(--co-ink); color: #fff; border-color: var(--co-ink); }
        .co-cat-pill:hover:not(.active) { border-color: #aaa; color: var(--co-ink); }
      `}</style>

      {/* ANNOUNCEMENT BAR */}
      <div style={{ background: "#141414", color: "#fff", fontSize: 12, padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontWeight: 500 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623", display: "inline-block" }} />
          End-of-season clearance — up to 60% off
        </span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Ends in <strong style={{ fontVariantNumeric: "tabular-nums" }}>{countdown}</strong></span>
      </div>

      {/* SCROLLING TRUST MARQUEE */}
      <div style={{ background: "#1F1C17", color: "#aaa", fontSize: 11, padding: "8px 0", overflow: "hidden", letterSpacing: "0.1em" }}>
        <div className="co-marquee">
          {[0, 1].map((r) => (
            <span key={r} style={{ display: "inline-flex", gap: 0 }} aria-hidden={r === 1}>
              {MARQUEE_TRUST.map((item) => (
                <span key={item} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ padding: "0 20px" }}>{item}</span>
                  <span style={{ opacity: 0.4 }}>+</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section style={{ background: "var(--co-bg)", padding: "72px 40px 56px", textAlign: "center" }}>
        {/* Avatar dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: -8, marginBottom: 14 }}>
          {["#FCEAE8","#EAE6F8","#E0EDF8","#DFF0E8","#F5E0EE"].map((c, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: "2px solid var(--co-bg)", marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i, position: "relative" }} />
          ))}
        </div>
        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "var(--co-ink-2)", marginBottom: 28 }}>
          <span style={{ color: "#F5C242", letterSpacing: 2 }}>★★★★★</span>
          <strong style={{ color: "var(--co-ink)" }}>4.8</strong>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>12,480 verified reviews</span>
        </div>

        {/* HERO HEADING */}
        <h1 style={{ fontFamily: "'Manrope', -apple-system, sans-serif", fontWeight: 800, fontSize: "clamp(48px, 7.5vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "var(--co-ink)", margin: "0 auto 24px", maxWidth: 900 }}>
          The good stuff,{" "}
          <em style={{ fontStyle: "italic", fontWeight: 800 }}>checked out</em>{" "}
          fast.
        </h1>

        <p style={{ fontSize: 16, color: "var(--co-ink-2)", margin: "0 auto 36px", maxWidth: 420, lineHeight: 1.55 }}>
          Hand-picked products at sharp prices. Free shipping over £40.<br />
          Thirty-day money-back, no questions.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link to="/shop">
            <button className="co-pill-btn yellow">Shop everything →</button>
          </Link>
          <Link to="/shop" style={{ fontSize: 14, fontWeight: 600, color: "var(--co-ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Best sellers
          </Link>
        </div>

        {/* Trust bullets */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 28, fontSize: 13, color: "var(--co-ink-3)" }}>
          {["Free shipping £40+", "30-day returns", "2-year warranty"].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--co-yellow)", display: "inline-block" }} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* HORIZONTAL PRODUCT CAROUSEL */}
      <section style={{ padding: "0 0 64px", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 16, padding: "0 40px", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
          {(products.length > 0 ? products : Array(6).fill(null)).map((p, idx) => (
            <CheckoutrCard key={p?.id ?? idx} product={p} index={idx} onAdd={p ? () => handleAdd(p) : () => {}} />
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid var(--co-hair)", borderBottom: "1px solid var(--co-hair)" }}>
        {[
          { icon: "★", val: "4.8★", sub: "across 12,480 reviews", yellow: true },
          { icon: "↩", val: "30-day", sub: "no-questions returns" },
          { icon: "◎", val: "2-yr", sub: "warranty on everything" },
          { icon: "→", val: "Free", sub: "shipping on £40 orders" },
        ].map((t, i) => (
          <div key={i} style={{ padding: "28px 32px", background: t.yellow ? "var(--co-yellow)" : "var(--co-surface)", borderRight: i < 3 ? "1px solid var(--co-hair)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.yellow ? "rgba(0,0,0,0.08)" : "var(--co-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {t.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.val}</div>
              <div style={{ fontSize: 12, color: "var(--co-ink-2)", marginTop: 2 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* THE SHELF */}
      <section style={{ padding: "80px 40px 96px", background: "var(--co-bg)" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start", marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--co-ink-3)", marginBottom: 10, fontWeight: 600 }}>THE SHELF</div>
            <h2 style={{ fontFamily: "var(--co-serif)", fontWeight: 400, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.08, margin: 0 }}>
              {products.length > 0 ? `${products.length} things` : "Things"}<br />worth checking out.
            </h2>
          </div>
          <div style={{ paddingTop: 40 }}>
            <p style={{ fontSize: 14, color: "var(--co-ink-2)", lineHeight: 1.65, margin: 0 }}>
              Curated from thousands of products — only the ones our team would actually buy. No drop-shipped duds, no fake reviews, no "as seen on TV" nonsense.
            </p>
          </div>
        </div>

        {/* Category pills + sort */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`co-cat-pill${activeCategory === cat ? " active" : ""}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--co-ink-2)" }}>
            Sorted by <strong style={{ color: "var(--co-ink)" }}>Most loved ↓</strong>
          </div>
        </div>

        {/* Product grid */}
        {shelfProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--co-ink-3)", fontFamily: "var(--co-serif)", fontSize: 28 }}>
            The shelf is being stocked — check back soon.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {shelfProducts.map((p, idx) => (
              <CheckoutrCard key={p.id} product={p} index={idx} onAdd={() => handleAdd(p)} grid />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link to="/shop" style={{ fontSize: 14, fontWeight: 600, color: "var(--co-ink)", textDecoration: "underline", textUnderlineOffset: 4 }}>
              Browse all {products.length} products →
            </Link>
          </div>
        )}
      </section>

      {/* NEWSLETTER (inside page, above footer) */}
      <div style={{ background: "var(--co-bg)", borderTop: "1px solid var(--co-hair)", padding: "56px 40px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, background: "var(--co-yellow)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✓</div>
            <span style={{ fontFamily: "var(--co-serif)", fontSize: 20, fontStyle: "italic" }}>{company_name}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--co-ink-2)", marginBottom: 20, lineHeight: 1.55 }}>
            Gear that actually works, at prices that don't insult you. Get £10 off your first order.
          </p>
          {newsletterSent ? (
            <p style={{ fontSize: 13, color: "green", fontWeight: 600 }}>✓ You're in! Check your inbox for the code.</p>
          ) : (
            <form onSubmit={submitNewsletter} style={{ display: "flex", gap: 10 }}>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                style={{ flex: 1, border: "1px solid var(--co-hair)", borderRadius: 999, padding: "12px 18px", fontSize: 13, outline: "none", background: "var(--co-surface)", color: "var(--co-ink)" }}
              />
              <button type="submit" className="co-pill-btn yellow" style={{ fontSize: 13, padding: "12px 20px" }}>
                Get £10 off
              </button>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function CheckoutrCard({ product, index, onAdd, grid }: { product: Product | null; index: number; onAdd: () => void; grid?: boolean }) {
  const bg = CARD_PASTELS[index % CARD_PASTELS.length];
  const showSale = product && Number(product.price_1) > Number(product.price_2) && Number(product.price_2) > 0;
  const discountPct = showSale ? Math.round((1 - Number(product!.price_2) / Number(product!.price_1)) * 100) : 0;

  const cardStyle: React.CSSProperties = grid
    ? { display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", background: "var(--co-surface)", border: "1px solid var(--co-hair)" }
    : { flexShrink: 0, width: 300, display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", scrollSnapAlign: "start" };

  return (
    <div className="co-card" style={cardStyle}>
      {/* Image area */}
      <div style={{ position: "relative", background: bg, aspectRatio: grid ? "1 / 1.1" : "1 / 1.4", overflow: "hidden" }}>
        {/* Category tag */}
        {product && (
          <span style={{ position: "absolute", top: 14, left: 14, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--co-ink-2)", zIndex: 2 }}>
            {product.subdomain?.replace(/-/g, " ").toUpperCase() || "PRODUCT"}
          </span>
        )}
        {/* Discount badge */}
        {showSale && discountPct > 0 && (
          <span style={{ position: "absolute", top: 14, right: 14, background: "#1A1A1A", color: "#fff", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700, zIndex: 2 }}>
            -{discountPct}%
          </span>
        )}
        {/* Product image or placeholder icon */}
        {product?.image_url ? (
          <img src={product.image_url} alt={product.product_name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: 20 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#1A1A1A" strokeWidth="1.5" opacity={0.35}>
              <rect x="8" y="8" width="48" height="48" rx="8" />
              <circle cx="32" cy="32" r="10" />
              <line x1="32" y1="8" x2="32" y2="22" />
              <line x1="32" y1="42" x2="32" y2="56" />
            </svg>
          </div>
        )}
        {/* Hover add button */}
        {product && (
          <button
            className="co-checkout-btn"
            onClick={(e) => { e.preventDefault(); onAdd(); }}
            style={{ position: "absolute", left: 12, right: 12, bottom: 12, background: "var(--co-yellow)", color: "var(--co-ink)", border: "none", borderRadius: 12, padding: "13px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: 0, transform: "translateY(6px)", transition: "opacity .22s, transform .22s", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}
          >
            <span>Add to checkout</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 16px 8px" }}>
        {product ? (
          <Link to="/products/$subdomain" params={{ subdomain: product.subdomain }} style={{ color: "inherit", textDecoration: "none" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.3, color: "var(--co-ink)" }}>{product.product_name}</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>£{Number(product.price_2).toFixed(2)}</span>
              {showSale && <span style={{ textDecoration: "line-through", color: "var(--co-ink-3)", fontSize: 12 }}>£{Number(product.price_1).toFixed(2)}</span>}
            </div>
          </Link>
        ) : (
          <div style={{ height: 40, background: "var(--co-hair)", borderRadius: 6, opacity: 0.5 }} />
        )}
      </div>

      {/* Yellow checkout button (always visible below card) */}
      {product && (
        <button
          onClick={onAdd}
          style={{ margin: "8px 12px 14px", background: "var(--co-yellow)", color: "var(--co-ink)", border: "none", borderRadius: 12, padding: "13px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>Add to checkout</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
}
