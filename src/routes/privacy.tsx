import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CheckoutHubs" },
      { name: "description", content: "How CheckoutHubs collects, uses and protects your personal data under UK GDPR." },
    ],
  }),
  component: Privacy,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 January 2025</p>
        <p className="mt-6 text-muted-foreground">
          CheckoutHubs Ltd ("we", "us", "our") respects your privacy. This policy explains how we collect, use, store and protect your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
        </p>

        <Section title="Data we collect">
          <p>We collect information you provide when placing an order or contacting us, including your name, billing/delivery address, email, phone number, and payment details. We also collect technical data such as IP address, browser type, device information, and pages visited via cookies and analytics.</p>
        </Section>

        <Section title="How we use your data">
          <p>We use your data to process and deliver orders, provide customer service, send order updates, prevent fraud, comply with legal obligations, and (with consent) send marketing communications. Our lawful bases include contract performance, legal obligation, legitimate interests, and consent.</p>
        </Section>

        <Section title="Cookies">
          <p>We use essential cookies to operate the site and analytics cookies to understand site usage. You can control cookies through your browser settings. Non-essential cookies are only set with your consent.</p>
        </Section>

        <Section title="Third parties">
          <p>We share data with trusted service providers including payment processors, delivery couriers, email providers, and analytics platforms. These providers process data on our behalf under written agreements and only for the purposes we specify. We do not sell personal data.</p>
        </Section>

        <Section title="Your rights">
          <p>Under UK GDPR you have the right to access, rectify, erase, restrict, port or object to the processing of your personal data, and to withdraw consent at any time. You may also lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.</p>
        </Section>

        <Section title="Data retention">
          <p>We retain order data for up to 7 years to comply with UK tax and accounting law. Marketing data is retained until you unsubscribe.</p>
        </Section>

        <Section title="Contact for data requests">
          <p>To exercise any of your rights, email <strong className="text-foreground">support@checkouthubs.com</strong>. We will respond within 30 days.</p>
        </Section>
      </div>
    </SiteLayout>
  );
}
