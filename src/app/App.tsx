import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { DashboardPage } from "./components/pages/DashboardPage";
import { SensorsPage } from "./components/pages/SensorsPage";
import { LocationsPage } from "./components/pages/LocationsPage";
import { AlertsPage } from "./components/pages/AlertsPage";
import { alerts } from "./components/data";
import { Toaster } from "./components/ui/sonner";

type Page = "dashboard" | "sensors" | "locations" | "alerts";

const pageMeta: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Real-time overview of your smart city network" },
  sensors: { title: "Sensors", subtitle: "Manage IoT devices across the network" },
  locations: { title: "Locations", subtitle: "Districts, zones and sensor coverage" },
  alerts: { title: "Alerts", subtitle: "System events and incident management" },
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(false);
  const [sensorStatusFilter, setSensorStatusFilter] = useState<string>("all");
  const [sensorDistrictFilter, setSensorDistrictFilter] = useState<string>("all");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.lang = "en";
  }, [dark]);

  useEffect(() => {
    document.title = `${pageMeta[page].title} · Sensor-SmAArt-City`;
  }, [page]);

  const meta = pageMeta[page];
  const unresolved = alerts.filter((a) => !a.resolved).length;

  function navigate(p: Page, opts?: { sensorStatus?: string; sensorDistrict?: string }) {
    if (opts?.sensorStatus) setSensorStatusFilter(opts.sensorStatus);
    if (opts?.sensorDistrict) setSensorDistrictFilter(opts.sensorDistrict);
    setPage(p);
  }

  return (
    <div className="size-full flex bg-background text-foreground overflow-hidden" lang="en">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar current={page} onNavigate={(p) => navigate(p)} alertCount={unresolved} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={meta.title} subtitle={meta.subtitle} dark={dark} onToggleDark={() => setDark((d) => !d)} onOpenAlerts={() => navigate("alerts")} />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1} aria-label={meta.title}>
          {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {page === "sensors" && <SensorsPage initialStatus={sensorStatusFilter} initialDistrict={sensorDistrictFilter} onConsumeStatus={() => setSensorStatusFilter("all")} onConsumeDistrict={() => setSensorDistrictFilter("all")} />}
          {page === "locations" && <LocationsPage onNavigate={navigate} />}
          {page === "alerts" && <AlertsPage />}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
