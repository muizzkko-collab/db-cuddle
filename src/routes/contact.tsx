import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { useDomain } from "@/contexts/DomainContext";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — checkoutculture" },
      { name: "description", content: "Real human support — get in touch with our team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const { support_email, address, phone, company_name } = useDomain();

  return (
    <SiteLayout>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "0 40px 96px" }}>
        {/* Hero */}
        <section style={{ padding: "80px 0 56px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", gap: 8, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)" }}>
            <Link to="/">Home</Link>
            <span>/</span>
            <span style={{ color: "var(--ch-ink-2)" }}>Contact</span>
          </div>
          <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— Real humans</span>
          <h1 style={{ fontFamily: "var(--ch-serif)", fontSize: "clamp(56px, 7vw, 88px)", lineHeight: 1.05, margin: "12px 0 16px", fontWeight: 400 }}>
            Get in touch.
          </h1>
          <p style={{ color: "var(--ch-ink-2)", fontSize: 17, maxWidth: 540, margin: "0 auto" }}>
            We reply within 24 hours, every day. No chatbots, no ticket numbers — just our team.
          </p>
        </section>

        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64 }}>
            {/* Form */}
            <div style={{ background: "var(--ch-surface)", border: "1px solid var(--ch-hair)", borderRadius: 18, padding: 40 }}>
              {sent ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--ch-serif)", fontSize: 56, color: "var(--ch-accent)", marginBottom: 16 }}>✦</div>
                  <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 32, lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400 }}>Thanks — we got it.</h2>
                  <p style={{ color: "var(--ch-ink-2)", margin: 0 }}>We'll reply within 24 hours, usually a lot sooner.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <h2 style={{ fontFamily: "var(--ch-serif)", fontSize: 28, lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400 }}>Send us a message</h2>
                  {[
                    { id: "name", label: "Your name", type: "text", placeholder: "Jane Doe" },
                    { id: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
                    { id: "subject", label: "Subject", type: "text", placeholder: "Order #1234 — return question" },
                  ].map((f) => (
                    <label key={f.id} style={{ display: "block" }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500 }}>{f.label}</span>
                      <input
                        id={f.id}
                        type={f.type}
                        required
                        placeholder={f.placeholder}
                        style={{
                          marginTop: 8,
                          width: "100%",
                          background: "var(--ch-bg-elev)",
                          border: "1px solid var(--ch-hair)",
                          borderRadius: 8,
                          padding: "12px 14px",
                          fontSize: 14,
                          color: "var(--ch-ink)",
                          outline: "none",
                        }}
                      />
                    </label>
                  ))}
                  <label>
                    <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500 }}>Message</span>
                    <textarea
                      required
                      rows={6}
                      placeholder="Tell us what's on your mind…"
                      style={{
                        marginTop: 8,
                        width: "100%",
                        background: "var(--ch-bg-elev)",
                        border: "1px solid var(--ch-hair)",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 14,
                        color: "var(--ch-ink)",
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    style={{
                      marginTop: 8,
                      padding: "16px 28px",
                      borderRadius: 999,
                      background: "var(--ch-ink)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    Send message →
                  </button>
                </form>
              )}
            </div>

            {/* Contact details */}
            <div>
              <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 16, color: "var(--ch-accent)" }}>— Direct lines</span>
              <h3 style={{ fontFamily: "var(--ch-serif)", fontSize: 32, lineHeight: 1.1, margin: "8px 0 32px", fontWeight: 400 }}>
                Or reach us<br />directly.
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <ContactRow label="Email" value={support_email ?? `support@${company_name?.toLowerCase().replace(/\s+/g, "")}.com`} />
                <ContactRow label="Address" value={address ?? "London, United Kingdom"} />
                {phone && <ContactRow label="Phone" value={phone} />}
                <ContactRow label="Support hours" value="Mon–Fri · 9am–5pm GMT" />
              </div>

              <div style={{ marginTop: 40, padding: 24, background: "var(--ch-bg-elev)", borderRadius: 14 }}>
                <p style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-ink)", margin: 0, lineHeight: 1.5 }}>
                  "Genuine humans who actually reply. Took me by surprise."
                </p>
                <p style={{ fontSize: 12, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 12 }}>
                  — Trustpilot · Verified
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderLeft: "1px solid var(--ch-hair)", paddingLeft: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: "var(--ch-serif)", fontSize: 20, color: "var(--ch-ink)", marginTop: 4 }}>{value}</div>
    </div>
  );
}
