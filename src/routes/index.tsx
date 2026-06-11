import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const TESTIMONIALS = [
  { name: "Eloise M.", location: "London · Customer since 2024", text: "I was a skeptic. Six weeks in, my whole routine is simpler and actually delivers. The curation is doing real work here.", stars: 5, initials: "EM", productTag: "Voltix Energy Saver", source: "Trustpilot · Verified" },
  { name: "Jordan R.", location: "Brooklyn · Customer since 2023", text: "Finally a shop that doesn't make me read sixteen review blogs. They've already done the homework — and shipping was lightning fast.", stars: 5, initials: "JR", productTag: "OraLaura Water Flosser", source: "Google · Verified" },
  { name: "Sana K.", location: "Berlin · Customer since 2025", text: "The bundle pricing is genuinely good and the customer support team actually replies. I'm on subscription, which I never do.", stars: 5, initials: "SK", productTag: "Bio Valtix Pro", source: "Trustpilot · Verified" },
];

const PRESS_LOGOS = ["Forbes", "TechRadar", "The Times", "Wired", "GQ", "Stylist", "Monocle"];

const MARQUEE_ITEMS = [
  "Tested for 6+ weeks",
  "Independent brands",
  "Honest pricing",
  "Fast tracked shipping",
  "30-day returns",
  "Real customer reviews",
];

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

function MainStore() {
  const { hero_headline, hero_subheadline, hero_image_url, company_name, rootDomain } = useDomain();
  const { addItem, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const domain = rootDomain || MAIN_DOMAIN;
      const isMain = domain === MAIN_DOMAIN;
      // Main domain gets unassigned products too; other domains get strict match only
      const filter = isMain
        ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null`
        : `root_domain.eq.${domain}`;
      const { data, error } = await (supabase.from("products").select("*").neq("active", false) as any)
        .or(filter)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!error) { setProducts((data ?? []) as Product[]); return; }
      // Fallback if root_domain column doesn't exist yet
      const { data: fallback } = await supabase.from("products").select("*").neq("active", false)
        .order("created_at", { ascending: false }).limit(6);
      setProducts((fallback ?? []) as Product[]);
    };
    loadProducts();
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

  const heroProduct = products[0];

  return (
    <SiteLayout>
      <div
        className="ch-store"
        style={{
          background: "var(--ch-bg)",
          color: "var(--ch-ink)",
          fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <style>{`
          .ch-store {
            --ch-bg: #F4EFE7;
            --ch-bg-elev: #FAF6EE;
            --ch-surface: #FFFFFF;
            --ch-ink: #1F1C17;
            --ch-ink-2: #4B463E;
            --ch-ink-3: #8C8478;
            --ch-hair: #E5DED1;
            --ch-accent: #6C7C5E;
            --ch-accent-2: #C77A56;
            --ch-accent-soft: #D8E0CC;
            --ch-sale: #B5432B;
            --ch-serif: 'Instrument Serif', Georgia, serif;
          }
          .ch-store .ch-display { font-family: var(--ch-serif); font-weight: 400; letter-spacing: -0.015em; }
          .ch-store .ch-kicker { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ch-ink-2); font-weight: 500; }
          .ch-store .ch-eyebrow { font-family: var(--ch-serif); font-style: italic; font-size: 18px; color: var(--ch-accent); }
          .ch-store .ch-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px; border-radius: 999px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; transition: transform .2s ease, background .2s ease, color .2s ease; border: 1px solid transparent; }
          .ch-store .ch-btn:hover { transform: translateY(-1px); }
          .ch-store .ch-btn-primary { background: var(--ch-ink); color: #fff; }
          .ch-store .ch-btn-ghost { background: transparent; color: var(--ch-ink); border-color: var(--ch-ink); }
          .ch-store .ch-btn-ghost:hover { background: var(--ch-ink); color: #fff; }
          @keyframes ch-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .ch-store .ch-marquee-track { animation: ch-marquee 36s linear infinite; }
          .ch-store .ch-product:hover .ch-add { opacity: 1; transform: translateY(0); }
          .ch-store .ch-product:hover .ch-img-wrap { transform: translateY(-4px); }
        `}</style>

        {/* ANNOUNCEMENT */}
        <div style={{ background: "var(--ch-ink)", color: "#F4EFE7", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 0", textAlign: "center", fontWeight: 500 }}>
          ✦ Free UK / US / EU shipping over £50 · 30-day returns · 50,000+ orders shipped
        </div>

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden", padding: "56px 0 80px" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "center" }} className="ch-hero-grid">
              <div>
                <div className="ch-kicker">— Tested & approved · Issue No. 07</div>
                <h1 className="ch-display" style={{ fontSize: "clamp(56px, 6.8vw, 104px)", lineHeight: 1.08, margin: "22px 0 32px", paddingBottom: "0.35em" }}>
                  {hero_headline?.includes("everyday") || hero_headline?.includes("Everyday") ? (
                    <>Products that<br />actually work, for<br /><i style={{ color: "var(--ch-accent)" }}>everyday life.</i></>
                  ) : (
                    <>{hero_headline?.split(" ").slice(0, -1).join(" ")}<br /><i style={{ color: "var(--ch-accent)" }}>{hero_headline?.split(" ").slice(-1)}.</i></>
                  )}
                </h1>
                <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ch-ink-2)", maxWidth: 460, margin: "0 0 32px" }}>
                  {hero_subheadline}
                </p>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <Link to="/shop" className="ch-btn ch-btn-primary">Shop now →</Link>
                  <Link to="/about" className="ch-btn ch-btn-ghost">Our standards</Link>
                </div>
                <div style={{ display: "flex", gap: 36, marginTop: 48, paddingTop: 28, borderTop: "1px solid var(--ch-hair)" }}>
                  <div>
                    <span className="ch-display" style={{ fontSize: 32, lineHeight: 1, display: "block" }}>50k+</span>
                    <div style={{ fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>Happy customers</div>
                  </div>
                  <div>
                    <span className="ch-display" style={{ fontSize: 32, lineHeight: 1, display: "block" }}>4.9★</span>
                    <div style={{ fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>12,400 reviews</div>
                  </div>
                  <div>
                    <span className="ch-display" style={{ fontSize: 32, lineHeight: 1, display: "block" }}>30 day</span>
                    <div style={{ fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>No-quibble returns</div>
                  </div>
                </div>
              </div>

              {/* Hero product stage */}
              <div style={{ position: "relative", aspectRatio: "1 / 1.05", background: "radial-gradient(120% 80% at 50% 30%, var(--ch-bg-elev) 0%, var(--ch-bg) 70%)", borderRadius: 32, overflow: "hidden", boxShadow: "0 1px 2px rgba(31,28,23,.04), 0 24px 60px -28px rgba(31,28,23,.18)" }}>
                <div style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(8px)", border: "1px solid var(--ch-hair)", borderRadius: 999, padding: "8px 14px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", display: "inline-flex", gap: 8, alignItems: "center", zIndex: 2 }}>
                  <span style={{ width: 6, height: 6, background: "var(--ch-accent)", borderRadius: "50%" }} />
                  Editor's pick
                </div>
                {heroProduct?.image_url ? (
                  <img src={heroProduct.image_url} alt={heroProduct.product_name}
                    style={{ position: "absolute", left: "10%", top: "8%", width: "80%", height: "80%", objectFit: "contain" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 96, color: "var(--ch-ink-3)" }}>
                    {company_name?.[0] ?? "C"}
                  </div>
                )}
                {heroProduct && (
                  <div style={{ position: "absolute", right: 22, bottom: 22, background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 2px rgba(31,28,23,.04), 0 24px 60px -28px rgba(31,28,23,.18)", maxWidth: 240 }}>
                    <div className="ch-display" style={{ fontSize: 20, lineHeight: 1.1 }}>{heroProduct.product_name}</div>
                    <div style={{ fontSize: 12, color: "var(--ch-ink-2)", marginTop: 4, letterSpacing: "0.04em" }}>£{Number(heroProduct.price_2).toFixed(2)} · Bundle</div>
                    <div style={{ color: "var(--ch-accent-2)", fontSize: 12, letterSpacing: 2, marginTop: 8 }}>★★★★★ <span style={{ color: "var(--ch-ink-3)", letterSpacing: 0, marginLeft: 6 }}>2,143 reviews</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <div style={{ background: "var(--ch-surface)", borderTop: "1px solid var(--ch-hair)", borderBottom: "1px solid var(--ch-hair)" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }} className="ch-trust-grid">
              {[
                { ttl: "Free shipping", sub: "On orders over £50" },
                { ttl: "30-day returns", sub: "No questions, ever" },
                { ttl: "Tested for real life", sub: "6+ weeks, by us" },
                { ttl: "Independent brands", sub: "Founder-led, vetted" },
              ].map((t, i) => (
                <div key={t.ttl} style={{ display: "flex", gap: 16, alignItems: "center", padding: "28px 32px", borderRight: i < 3 ? "1px solid var(--ch-hair)" : "none" }}>
                  <div style={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: "50%", background: "var(--ch-bg-elev)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ch-accent)", fontFamily: "var(--ch-serif)", fontSize: 20 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.ttl}</div>
                    <div style={{ fontSize: 12, color: "var(--ch-ink-3)", marginTop: 2 }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROMO BANNERS */}
        <section style={{ padding: "96px 0 40px" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="ch-eyebrow" style={{ display: "block", marginBottom: 10 }}>— What's on now</span>
              <h2 className="ch-display" style={{ fontSize: 52, lineHeight: 1, margin: 0 }}>Edits worth opening.</h2>
              <p style={{ color: "var(--ch-ink-2)", fontSize: 15, maxWidth: 460, margin: "14px auto 0" }}>
                Seasonal bundles and the discoveries our team can't stop using.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 20 }} className="ch-promos">
              {/* Big promo */}
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 380, display: "flex", alignItems: "flex-end", padding: 32, color: "#fff", background: "linear-gradient(120deg, #2b3225 0%, #455338 100%)" }}>
                <div style={{ position: "relative", zIndex: 1, maxWidth: "60%" }}>
                  <span style={{ display: "inline-block", background: "rgba(255,255,255,0.9)", color: "var(--ch-ink)", padding: "6px 12px", borderRadius: 999, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
                    Save 25% · This week
                  </span>
                  <h3 className="ch-display" style={{ fontSize: 44, lineHeight: 1.02, margin: "0 0 12px" }}>The Essentials<br />Bundle.</h3>
                  <p style={{ fontSize: 14, opacity: 0.92, margin: "0 0 22px", maxWidth: 320 }}>
                    Our three best-sellers, bundled. The kit that gets repeat orders every month.
                  </p>
                  <Link to="/shop" className="ch-btn" style={{ background: "#fff", color: "var(--ch-ink)" }}>Shop the bundle →</Link>
                </div>
              </div>

              {/* Stacked small promos */}
              <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 20 }}>
                <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 180, padding: "24px 28px", color: "#fff", background: "linear-gradient(120deg, #C77A56 0%, #D9926D 100%)", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
                    <span style={{ display: "inline-block", background: "rgba(255,255,255,0.9)", color: "var(--ch-ink)", padding: "5px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
                      New arrivals
                    </span>
                    <h3 className="ch-display" style={{ fontSize: 28, lineHeight: 1.02, margin: "0 0 10px" }}>Just landed.</h3>
                    <p style={{ fontSize: 13, opacity: 0.92, margin: "0 0 14px" }}>The latest drop from our most-loved brands.</p>
                    <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 4 }}>
                      Explore →
                    </Link>
                  </div>
                </div>
                <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 180, padding: "24px 28px", color: "#fff", background: "linear-gradient(120deg, #5a4733 0%, #826851 100%)", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
                    <span style={{ display: "inline-block", background: "rgba(255,255,255,0.9)", color: "var(--ch-ink)", padding: "5px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
                      Awards 2026
                    </span>
                    <h3 className="ch-display" style={{ fontSize: 28, lineHeight: 1.02, margin: "0 0 10px" }}>Best of the year.</h3>
                    <p style={{ fontSize: 13, opacity: 0.92, margin: "0 0 14px" }}>The products our community voted into the hall of fame.</p>
                    <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 4 }}>
                      See the list →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section style={{ padding: "96px 0" }} id="products">
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="ch-eyebrow" style={{ display: "block", marginBottom: 10 }}>— Most-loved this month</span>
              <h2 className="ch-display" style={{ fontSize: 52, lineHeight: 1, margin: 0 }}>Featured products.</h2>
              <p style={{ color: "var(--ch-ink-2)", fontSize: 15, maxWidth: 460, margin: "14px auto 0" }}>
                An opinionated selection. We only stock what our team genuinely uses.
              </p>
            </div>

            {products.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--ch-ink-3)" }}>No products yet — check back soon!</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }} className="ch-products-grid">
                {products.map((p, idx) => (
                  <EditorialProductCard key={p.id} product={p} index={idx} onAdd={() => handleAdd(p)} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: 56 }}>
              <Link to="/shop" className="ch-btn ch-btn-ghost">Shop all products →</Link>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ background: "var(--ch-accent)", color: "#F4EFE7", overflow: "hidden", padding: "14px 0" }}>
          <div className="ch-marquee-track" style={{ display: "flex", gap: 56, whiteSpace: "nowrap", fontFamily: "var(--ch-serif)", fontSize: 22, fontStyle: "italic" }}>
            {[0, 1].map((rep) => (
              <span key={rep} style={{ display: "inline-flex", alignItems: "center", gap: 56 }} aria-hidden={rep === 1}>
                {MARQUEE_ITEMS.map((item, i) => (
                  <span key={`${rep}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 56 }}>
                    {item}
                    <span style={{ fontSize: 14, opacity: 0.6 }}>✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* BRAND STORY */}
        <section style={{ padding: "96px 0" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ background: "var(--ch-bg-elev)", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", minHeight: 520 }} className="ch-story-grid">
                <div style={{ position: "relative", background: "var(--ch-accent-soft)", minHeight: 320 }}>
                  {hero_image_url ? (
                    <img src={hero_image_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 120, color: "var(--ch-accent)", opacity: 0.4 }}>
                      ✦
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 24, left: 24, width: 110, height: 110, borderRadius: "50%", background: "var(--ch-ink)", color: "var(--ch-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", textAlign: "center", lineHeight: 1.05, fontSize: 14, border: "6px solid var(--ch-bg-elev)" }}>
                    Vetted<br />by us<br />2026
                  </div>
                </div>
                <div style={{ padding: "72px 64px" }} className="ch-story-body">
                  <span className="ch-eyebrow" style={{ display: "inline-block", marginBottom: 14 }}>— Our standards</span>
                  <h2 className="ch-display" style={{ fontSize: 56, lineHeight: 1, margin: "0 0 24px" }}>The shelf is full.<br />Trust is rare.</h2>
                  <p style={{ fontSize: 16, color: "var(--ch-ink-2)", maxWidth: 460, margin: "0 0 18px" }}>
                    We started {company_name} because shopping online means wading through hype. Every product we stock passes three filters: real-world testing, transparent specs, and a guarantee that backs it up.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 32px", margin: "32px 0 36px" }}>
                    {[
                      { h: "Read the spec", t: "Honest descriptions. No marketing fluff hiding the real story." },
                      { h: "Tested in real life", t: "Six weeks minimum, by our team — not just spec sheets." },
                      { h: "Independent first", t: "We work with founder-led brands building products that last." },
                      { h: "Backed by guarantee", t: "30-day no-quibble returns. We stand behind everything we ship." },
                    ].map((p) => (
                      <div key={p.h} style={{ borderLeft: "1px solid var(--ch-hair)", paddingLeft: 16 }}>
                        <h4 className="ch-display" style={{ fontSize: 18, margin: "0 0 4px", fontWeight: 500 }}>{p.h}</h4>
                        <p style={{ fontSize: 13, margin: 0, color: "var(--ch-ink-2)" }}>{p.t}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/about" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 4 }}>
                    Read the full standards →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section style={{ padding: "96px 0" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }} className="ch-reviews-head">
              <div>
                <span className="ch-eyebrow">— What people say</span>
                <h2 className="ch-display" style={{ fontSize: 52, lineHeight: 1, margin: "8px 0 0", textAlign: "left" }}>
                  Loved by 50,000+<br />everyday customers.
                </h2>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: "var(--ch-ink-2)" }}>
                <span className="ch-display" style={{ fontSize: 38, lineHeight: 1, display: "block", marginBottom: 6 }}>4.9 / 5</span>
                <span style={{ color: "var(--ch-accent-2)", letterSpacing: 3 }}>★★★★★</span>
                <br />
                <span style={{ marginTop: 6, display: "inline-block" }}>12,408 verified reviews</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="ch-reviews-grid">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} style={{ background: "var(--ch-surface)", border: "1px solid var(--ch-hair)", borderRadius: 18, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--ch-accent-2)", letterSpacing: 2, fontSize: 14 }}>{"★".repeat(t.stars)}</span>
                    <span style={{ fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.16em", textTransform: "uppercase" }}>{t.source}</span>
                  </div>
                  <p className="ch-display" style={{ fontSize: 22, lineHeight: 1.25, margin: 0 }}>"{t.text}"</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ch-ink-2)", background: "var(--ch-bg-elev)", padding: "6px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--ch-accent-soft)" }} />
                    {t.productTag}
                  </span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: "auto" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ch-accent-soft)", fontFamily: "var(--ch-serif)", fontSize: 18, color: "var(--ch-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ch-ink-3)" }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRESS */}
        <div style={{ padding: "64px 0", background: "var(--ch-bg-elev)", borderTop: "1px solid var(--ch-hair)", borderBottom: "1px solid var(--ch-hair)" }}>
          <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
              <div style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-ink-2)" }}>As featured in —</div>
              <div style={{ display: "flex", gap: 56, flexWrap: "wrap", alignItems: "center", opacity: 0.8 }}>
                {PRESS_LOGOS.map((logo, i) => (
                  <span key={logo} style={{
                    fontFamily: i % 2 === 0 ? "var(--ch-serif)" : "'Manrope', sans-serif",
                    fontStyle: i % 3 === 0 ? "italic" : "normal",
                    fontWeight: i % 2 === 1 ? 800 : 400,
                    fontSize: i % 2 === 0 ? 22 : 14,
                    letterSpacing: i % 2 === 1 ? "0.18em" : "0.04em",
                    textTransform: i % 2 === 1 ? "uppercase" : "none",
                    color: "var(--ch-ink)",
                  }}>{logo}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NEWSLETTER */}
        <section style={{ padding: "96px 0", background: "var(--ch-ink)", color: "#D7CFC0" }}>
          <div className="mx-auto" style={{ maxWidth: 640, padding: "0 40px", textAlign: "center" }}>
            <span className="ch-eyebrow" style={{ color: "var(--ch-accent-soft)" }}>— Join the list</span>
            <h2 className="ch-display" style={{ fontSize: 48, lineHeight: 1, margin: "12px 0 16px", color: "#fff" }}>
              10% off your first order.
            </h2>
            <p style={{ fontSize: 15, color: "#B8AE9C", margin: "0 0 32px" }}>
              First-look drops, restock alerts, and the very occasional editorial. No spam, ever.
            </p>
            {newsletterSent ? (
              <p style={{ background: "rgba(108,124,94,0.2)", border: "1px solid var(--ch-accent)", borderRadius: 8, padding: "14px 20px", fontSize: 14, color: "var(--ch-accent-soft)", maxWidth: 400, margin: "0 auto" }}>
                ✓ You're subscribed. Check your inbox for your code.
              </p>
            ) : (
              <form onSubmit={submitNewsletter} style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto" }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  style={{ flex: 1, background: "transparent", border: 0, borderBottom: "1px solid #4a443a", padding: "10px 0", color: "#fff", outline: "none", fontSize: 14 }}
                />
                <button type="submit" style={{ background: "var(--ch-bg)", color: "var(--ch-ink)", border: 0, padding: "12px 22px", borderRadius: 999, fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function EditorialProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: () => void }) {
  const bgTints = ["#F4EFE7", "#E8DDD0", "#DDE3D2", "#F0E5D6", "#E4DAC8", "#EDE4D2", "#E1E8D9", "#EFE2D5"];
  const bg = bgTints[index % bgTints.length];
  const showSale = Number(product.price_1) > Number(product.price_2) && Number(product.price_2) > 0;
  const badge = index === 0 ? "Best seller" : index === 1 ? "New" : showSale ? `−${Math.round((1 - Number(product.price_2) / Number(product.price_1)) * 100)}%` : null;
  const badgeBg = badge === "New" ? "var(--ch-accent)" : badge?.startsWith("−") ? "var(--ch-sale)" : "var(--ch-ink)";

  return (
    <div className="ch-product" style={{ position: "relative" }}>
      <div className="ch-img-wrap" style={{ position: "relative", aspectRatio: "1 / 1.1", background: bg, borderRadius: 14, overflow: "hidden", marginBottom: 18, transition: "transform .3s ease" }}>
        {badge && (
          <span style={{ position: "absolute", top: 14, left: 14, background: badgeBg, color: "#fff", padding: "5px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, zIndex: 2 }}>
            {badge}
          </span>
        )}
        <button aria-label="Save" style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "1px solid var(--ch-hair)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ch-ink-2)", zIndex: 2, cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s-7-4.5-9.3-9.1C1 9.4 2.3 5.5 6 5c2-.2 3.7.7 6 3 2.3-2.3 4-3.2 6-3 3.7.5 5 4.4 3.3 6.9C19 16.5 12 21 12 21z" />
          </svg>
        </button>
        {product.image_url ? (
          <img src={product.image_url} alt={product.product_name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 64, color: "var(--ch-ink-3)" }}>
            {product.product_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <button onClick={onAdd} className="ch-add" style={{ position: "absolute", left: 14, right: 14, bottom: 14, padding: "12px 14px", background: "var(--ch-ink)", color: "#fff", border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0, transform: "translateY(8px)", transition: "opacity .25s ease, transform .25s ease", zIndex: 2, cursor: "pointer" }}>
          Add to bag · £{Number(product.price_2).toFixed(0)}
        </button>
      </div>
      <Link to="/products/$subdomain" params={{ subdomain: product.subdomain }} style={{ color: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          <span>{product.subdomain}</span>
          <span>★ 4.8</span>
        </div>
        <h3 className="ch-display" style={{ fontSize: 22, lineHeight: 1.15, margin: "0 0 6px" }}>{product.product_name}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {showSale && <span style={{ color: "var(--ch-ink-3)", textDecoration: "line-through", fontWeight: 400, marginRight: 6 }}>£{Number(product.price_1).toFixed(2)}</span>}
            £{Number(product.price_2).toFixed(2)}
          </div>
        </div>
      </Link>
    </div>
  );
}
