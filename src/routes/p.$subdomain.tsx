import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$subdomain")({
  component: () => <Outlet />,
});
