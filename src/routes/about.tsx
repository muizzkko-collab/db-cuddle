import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useDomain } from "@/contexts/DomainContext";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — checkoutculture" },
      { name: "description", content: "Curated, tested products from independent brands. Built for everyday life." },
    ],
  }),
  component: About,
});

function About() {
  const { company_name } = useDomain();

  return (
    <SiteLayout>
      <div className="mx-auto" style={{ maxWidth: 1320, padding: "0 40px" }}>
        {/* Hero */}
        <section style={{ padding: "80px 0", textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", gap: 8, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)" }}>
            <Link to="/">Home</Link>
            <span>/</span>
            <span style={{ color: "var(--ch-ink-2)" }}>About</span>
          </div>
          <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— Our standards</span>
          <h1 style={{ fontFamily: "var(--ch-serif)", fontSize: "clamp(56px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "16px auto 24px", fontWeight: 400, maxWidth: 900 }}>
            The shelf is full.<br />Trust is <i style={{ color: "var(--ch-accent)" }}>rare</i>.
          </h1>
          <p style={{ color: "var(--ch-ink-2)", fontSize: 17, maxWidth: 580, margin: "0 auto", lineHeight: 1.55 }}>
            We started {company_name} because shopping online means wading through hype. So we built a shop where every product passes three filters before it ever hits the shelf.
          </p>
        </section>

        {/* Image strip */}
        <section style={{ padding: "0 0 96px" }}>
          <div style={{ aspectRatio: "16 / 7", background: "var(--ch-accent-soft)", borderRadius: 24, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--ch-serif)", fontSize: 200, color: "var(--ch-accent)", opacity: 0.25 }}>✦</div>
            <div style={{ position: "absolute", bottom: 24, left: 24, width: 130, height: 130, borderRadius: "50%", background: "var(--ch-ink)", color: "var(--ch-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", textAlign: "center", lineHeight: 1.05, fontSize: 16, border: "6px solid var(--ch-bg)" }}>
              Vetted<br />by us<br />2026
            </div>
          </div>
        </section>

        {/* The three filters */}
        <section style={{ padding: "0 0 96px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)", display: "block", marginBottom: 10 }}>— How we choose</span>
            <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 52, lineHeight: 1, margin: 0, fontWeight: 400 }}>Three filters.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { n: "01", h: "Spec transparency", t: "Honest, full descriptions. No marketing fluff hiding the real story. If we can't explain why it works, we won't stock it." },
              { n: "02", h: "Real-world testing", t: "Every product is used by our team for six weeks minimum before launch. Spec sheets lie. Living with it doesn't." },
              { n: "03", h: "Backed by guarantee", t: "30-day no-quibble returns and a real human support team. If it doesn't work for you, we make it right." },
            ].map((f) => (
              <div key={f.n} style={{ background: "var(--ch-bg-elev)", border: "1px solid var(--ch-hair)", borderRadius: 18, padding: 32 }}>
                <div style={{ fontFamily: "var(--ch-serif)", fontSize: 48, color: "var(--ch-accent)", lineHeight: 1, marginBottom: 16 }}>{f.n}</div>
                <h3 style={{ fontFamily: "var(--ch-serif)", fontSize: 26, lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400 }}>{f.h}</h3>
                <p style={{ color: "var(--ch-ink-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story / mission */}
        <section style={{ padding: "0 0 96px" }}>
          <div style={{ background: "var(--ch-bg-elev)", borderRadius: 24, padding: "64px 80px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "center" }}>
            <div>
              <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— Our story</span>
              <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 48, lineHeight: 1.05, margin: "12px 0 0", fontWeight: 400 }}>Started by people who got tired of guessing.</h2>
            </div>
            <div style={{ color: "var(--ch-ink-2)", fontSize: 16, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 16px" }}>
                We were customers first. Buying things online, returning half of them, wondering why nobody seemed to actually use what they sold.
              </p>
              <p style={{ margin: "0 0 16px" }}>
                {company_name} is small on purpose. We work with founder-led brands, ship from real warehouses, and answer support emails ourselves. No automated chatbots. No 47-page T&Cs. No surprises.
              </p>
              <p style={{ margin: 0 }}>
                If a product makes the shelf here, it's because we'd buy it again.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "0 0 96px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 48, lineHeight: 1.05, margin: "0 0 24px", fontWeight: 400 }}>
            See what made the shelf.
          </h2>
          <Link
            to="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 28px",
              borderRadius: 999,
              background: "var(--ch-ink)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Shop the collection →
          </Link>
        </section>
      </div>
    </SiteLayout>
  );
}
