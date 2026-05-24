import { Header } from "@/components/layout/header";
import { SettingsContent } from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        subtitle="Organisation settings, AI providers & integrations"
      />
      <SettingsContent />
    </>
  );
}
