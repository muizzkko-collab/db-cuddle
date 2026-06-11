import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/contexts/CartContext";
import { useDomain } from "@/contexts/DomainContext";
import { MAIN_DOMAIN } from "@/lib/domain";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Settings = Tables<"site_settings">;

export const Route = createFileRoute("/products/$subdomain")({
  component: ProductDetail,
});

const REVIEWS = [
  { name: "Sarah M.", date: "2 weeks ago", text: "Exactly as described. Quick delivery and packaging was perfect. Would buy again.", stars: 5 },
  { name: "James L.", date: "1 month ago", text: "Excellent quality for the price. Working great after a month of daily use.", stars: 5 },
  { name: "Priya K.", date: "3 weeks ago", text: "Easy setup and great customer support when I had a question. Highly recommend.", stars: 5 },
  { name: "Tom R.",   date: "5 days ago",  text: "Fantastic product. Exceeded my expectations and arrived faster than expected.", stars: 5 },
  { name: "Lisa H.", date: "2 months ago", text: "Really impressed with the build quality. Looks exactly like the photos.", stars: 4 },
  { name: "Dan W.",  date: "3 days ago",   text: "Great value for money. The packaging was secure and delivery was fast.", stars: 5 },
];

const RATING_BARS = [
  { stars: 5, pct: 78 },
  { stars: 4, pct: 15 },
  { stars: 3, pct: 5 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
];

function ProductDetail() {
  const { subdomain } = useParams({ from: "/products/$subdomain" });
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const { rootDomain } = useDomain();

  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");
  const [variant, setVariant] = useState(2);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("products").select("*").eq("subdomain", subdomain).maybeSingle();
      if (p) {
        setProduct(p as Product);
        setMainImage((p as Product).image_url ?? "");
        setVariant((p as Product).default_variant ?? 2);

        // Related products — strict domain match, main domain also gets unassigned
        const domain = rootDomain || MAIN_DOMAIN;
        const isMain = domain === MAIN_DOMAIN;
        const filter = isMain
          ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null`
          : `root_domain.eq.${domain}`;
        const { data: rd, error: re } = await (
          supabase.from("products").select("*").neq("active", false).neq("subdomain", subdomain).limit(3) as any
        ).or(filter);
        if (!re) {
          setRelated((rd ?? []) as Product[]);
        } else {
          // Fallback if root_domain column doesn't exist yet
          const { data: fallback } = await supabase.from("products").select("*").neq("active", false).neq("subdomain", subdomain).limit(3);
          setRelated((fallback ?? []) as Product[]);
        }
      }
      const { data: s } = await supabase.from("site_settings")
        .select("id,subdomain,brand_color,button_text_color,logo_url,favicon_url,gtm_id,meta_pixel_id,ga4_id,tiktok_pixel_id,thank_you_redirect_url,template_id,background_color,headline_color,text_color,button_style,font_family,custom_css,created_at")
        .eq("subdomain", subdomain).maybeSingle();
      if (s) setSettings(s as Settings);
      setLoading(false);
    })();
  }, [subdomain, rootDomain]);

  const brand = settings?.brand_color || "#2563eb";

  const selected = useMemo(() => {
    if (!product) return { label: "", price: 0 };
    if (variant === 1) return { label: product.label_1 ?? "Single", price: Number(product.price_1) };
    if (variant === 3) return { label: product.label_3 ?? "Bulk",   price: Number(product.price_3) };
    return { label: product.label_2 ?? "Bundle", price: Number(product.price_2) };
  }, [product, variant]);

  const addToCart = () => {
    if (!product) return;
    addItem({ product_id: product.id, subdomain: product.subdomain, product_name: product.product_name, image_url: product.image_url ?? "", variant_label: selected.label, unit_price: selected.price, quantity: 1 });
  };

  const buyNow = () => { addToCart(); navigate({ to: "/checkout" }); };

  if (loading) return (
    <SiteLayout>
      <div className="mx-auto" style={{ maxWidth: 1320, padding: "120px 40px", textAlign: "center", color: "var(--ch-ink-3)" }}>Loading…</div>
    </SiteLayout>
  );

  if (!product) return (
    <SiteLayout>
      <div className="mx-auto" style={{ maxWidth: 1320, padding: "120px 40px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--ch-serif)", fontSize: 40, color: "var(--ch-ink)" }}>Product not found.</p>
        <Link to="/shop" style={{ marginTop: 16, display: "inline-block", color: "var(--ch-accent)", textDecoration: "underline" }}>← Back to shop</Link>
      </div>
    </SiteLayout>
  );

  const unit1 = Number(product.price_1);
  const savings3 = unit1 > 0 ? Math.round((1 - Number(product.price_3) / (unit1 * 3)) * 100) : 0;

  const allImages = [
    ...(Array.isArray((product as any).images) ? (product as any).images.filter(Boolean) : []),
    product.image_url, product.image_url_2,
  ].filter((v, i, arr) => v && arr.indexOf(v) === i) as string[];

  const accordionItems = [
    { id: "details", title: "Product Details", body: product.subheadline ?? `Premium quality ${product.product_name}. Designed for everyday use with durability and performance in mind.` },
    { id: "shipping", title: "Shipping Information", body: "UK: 3–5 business days. International: 7–14 business days. All orders are tracked and fully insured." },
    { id: "returns", title: "Returns Policy", body: "30-day hassle-free returns. If you're not 100% satisfied, return it for a full refund — no questions asked." },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto" style={{ maxWidth: 1320, padding: "32px 40px 96px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, display: "flex", gap: 8, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)" }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <span style={{ color: "var(--ch-ink-2)" }}>{product.product_name}</span>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }}>
          {/* Images */}
          <div>
            <div style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--ch-bg-elev)", borderRadius: 18, overflow: "hidden" }}>
              {mainImage ? (
                <img src={mainImage} alt={product.product_name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 96, color: "var(--ch-ink-3)" }}>
                  {product.product_name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto" }}>
                {allImages.map((url) => (
                  <button
                    key={url}
                    onClick={() => setMainImage(url)}
                    style={{
                      width: 80, height: 80, flexShrink: 0, overflow: "hidden", borderRadius: 12,
                      border: mainImage === url ? "2px solid var(--ch-ink)" : "2px solid transparent",
                      background: "var(--ch-bg-elev)", cursor: "pointer", padding: 0,
                    }}
                  >
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500 }}>
              {product.subdomain}
            </span>
            <h1 style={{ fontFamily: "var(--ch-serif)", fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.015em", margin: "12px 0 16px", fontWeight: 400 }}>
              {product.product_name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--ch-accent-2)", letterSpacing: 2 }}>★★★★★</span>
              <span style={{ fontSize: 13, color: "var(--ch-ink-2)" }}>4.8 · </span>
              <a href="#reviews" style={{ fontSize: 13, color: "var(--ch-accent)", textDecoration: "underline" }}>2,847 verified reviews</a>
            </div>
            {product.subheadline && <p style={{ marginTop: 16, fontSize: 16, color: "var(--ch-ink-2)", lineHeight: 1.6 }}>{product.subheadline}</p>}

            <div style={{ height: 1, background: "var(--ch-hair)", margin: "28px 0" }} />

            {/* Bundle selector */}
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500, marginBottom: 14 }}>Choose your bundle</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { id: 1, label: product.label_1 ?? "Single",   price: unit1 },
                { id: 2, label: product.label_2 ?? "Bundle",   price: Number(product.price_2), popular: true },
                { id: 3, label: product.label_3 ?? "Bulk",     price: Number(product.price_3), savings: savings3 },
              ].filter(opt => opt.price > 0).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setVariant(opt.id)}
                  style={{
                    position: "relative",
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                    borderRadius: 14,
                    border: variant === opt.id ? "2px solid var(--ch-ink)" : "2px solid var(--ch-hair)",
                    background: variant === opt.id ? "var(--ch-bg-elev)" : "var(--ch-surface)",
                    padding: 20, textAlign: "left", cursor: "pointer",
                  }}
                >
                  {opt.popular && (
                    <span style={{ position: "absolute", top: -10, left: 16, borderRadius: 999, background: "var(--ch-accent)", color: "#fff", padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Most popular
                    </span>
                  )}
                  <div>
                    <div style={{ fontFamily: "var(--ch-serif)", fontSize: 20, color: "var(--ch-ink)" }}>{opt.label}</div>
                    {opt.savings && opt.savings > 0 ? <p style={{ fontSize: 12, color: "var(--ch-accent)", marginTop: 2 }}>Save {opt.savings}%</p> : null}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ch-ink)" }}>£{opt.price.toFixed(2)}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => { addToCart(); openCart(); }}
                style={{
                  width: "100%", padding: "16px 22px", borderRadius: 999,
                  background: "var(--ch-ink)", color: "#fff",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                  border: 0, cursor: "pointer",
                }}
              >
                Add to bag · £{selected.price.toFixed(2)}
              </button>
              <button
                onClick={buyNow}
                style={{
                  width: "100%", padding: "16px 22px", borderRadius: 999,
                  background: "transparent", color: "var(--ch-ink)",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                  border: "1px solid var(--ch-ink)", cursor: "pointer",
                }}
              >
                Buy now →
              </button>
            </div>

            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ch-ink-3)" }}>
              <span>Secure checkout</span>
              <span>30-day returns</span>
              <span>Free UK delivery</span>
            </div>

            {/* Accordions */}
            <div style={{ marginTop: 28, borderTop: "1px solid var(--ch-hair)" }}>
              {accordionItems.map((item) => (
                <div key={item.id} style={{ borderBottom: "1px solid var(--ch-hair)" }}>
                  <button
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                    style={{
                      display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                      padding: "18px 0", background: "transparent", border: 0, cursor: "pointer",
                      fontFamily: "var(--ch-serif)", fontSize: 18, color: "var(--ch-ink)",
                    }}
                  >
                    {item.title}
                    <span style={{ color: "var(--ch-ink-3)" }}>{openAccordion === item.id ? "−" : "+"}</span>
                  </button>
                  {openAccordion === item.id && (
                    <p style={{ paddingBottom: 18, fontSize: 14, color: "var(--ch-ink-2)", lineHeight: 1.7 }}>{item.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" style={{ marginTop: 96 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— What people say</span>
            <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 48, lineHeight: 1, margin: "12px 0 0", fontWeight: 400 }}>Customer reviews.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 48 }}>
            <div style={{ background: "var(--ch-surface)", border: "1px solid var(--ch-hair)", borderRadius: 18, padding: 28, alignSelf: "start" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--ch-serif)", fontSize: 64, lineHeight: 1, color: "var(--ch-ink)" }}>4.8</div>
                <div style={{ marginTop: 4, color: "var(--ch-accent-2)", letterSpacing: 2 }}>★★★★★</div>
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Out of 5</div>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {RATING_BARS.map((r) => (
                  <div key={r.stars} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 24, textAlign: "right", color: "var(--ch-ink-2)" }}>{r.stars}★</span>
                    <div style={{ flex: 1, height: 6, overflow: "hidden", borderRadius: 999, background: "var(--ch-hair)" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: "var(--ch-accent-2)", width: `${r.pct}%` }} />
                    </div>
                    <span style={{ width: 32, color: "var(--ch-ink-3)" }}>{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {REVIEWS.map((r) => (
                <article key={r.name} style={{ background: "var(--ch-surface)", border: "1px solid var(--ch-hair)", borderRadius: 14, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "var(--ch-ink)" }}>{r.name}</span>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ch-accent)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ch-accent)" }} />
                      Verified
                    </div>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--ch-accent-2)", letterSpacing: 2, fontSize: 13 }}>{"★".repeat(r.stars)}</span>
                    <span style={{ fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{r.date}</span>
                  </div>
                  <p style={{ marginTop: 12, fontFamily: "var(--ch-serif)", fontSize: 17, color: "var(--ch-ink)", lineHeight: 1.4 }}>"{r.text}"</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section style={{ marginTop: 96 }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— You may also like</span>
              <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 48, lineHeight: 1, margin: "12px 0 0", fontWeight: 400 }}>More from the shelf.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
              {related.map((p, i) => (
                <Link
                  key={p.id}
                  to="/products/$subdomain"
                  params={{ subdomain: p.subdomain }}
                  style={{ color: "inherit" }}
                >
                  <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: ["#F4EFE7", "#E8DDD0", "#DDE3D2"][i % 3], borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 48, color: "var(--ch-ink-3)" }}>
                        {p.product_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ch-ink-3)", marginBottom: 4 }}>{p.subdomain}</div>
                    <h3 style={{ fontFamily: "var(--ch-serif)", fontSize: 20, lineHeight: 1.15, margin: "0 0 4px", fontWeight: 400 }}>{p.product_name}</h3>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ch-ink)" }}>£{Number(p.price_2).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
