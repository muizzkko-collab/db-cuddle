import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isCountryCode } from "@/lib/countries";
import { CheckoutPage } from "@/components/checkout-page";

export const Route = createFileRoute("/p/$subdomain/$country")({
  component: PreviewSubdomainCountry,
});

function PreviewSubdomainCountry() {
  const { subdomain, country } = Route.useParams();
  const code = country.toLowerCase();
  if (!isCountryCode(code)) {
    return <Navigate to="/p/$subdomain" params={{ subdomain }} replace />;
  }
  return <CheckoutPage subdomain={subdomain} countryCode={code} countryFixed={true} />;
}
