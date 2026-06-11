import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { mapIsoToCode } from "@/lib/countries";

export const Route = createFileRoute("/p/$subdomain/")({
  component: PreviewSubdomainIndex,
});

function PreviewSubdomainIndex() {
  const { subdomain } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        navigate({
          to: "/p/$subdomain/$country",
          params: { subdomain, country: mapIsoToCode(d?.country_code) },
          replace: true,
        });
      })
      .catch(() => {
        if (cancelled) return;
        navigate({
          to: "/p/$subdomain/$country",
          params: { subdomain, country: "uk" },
          replace: true,
        });
      });
    return () => { cancelled = true; };
  }, [subdomain, navigate]);

  return <div className="flex min-h-screen items-center justify-center">Detecting country…</div>;
}
