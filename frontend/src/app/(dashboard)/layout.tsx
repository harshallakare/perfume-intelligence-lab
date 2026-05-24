import { Sidebar } from "@/components/layout/sidebar";
import { SettingsProvider } from "@/context/settings-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </SettingsProvider>
  );
}
