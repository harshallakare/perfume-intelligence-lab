import { Header } from "@/components/layout/header";
import { OlfactoryContent } from "@/components/olfactory/olfactory-content";

export default function OlfactoryPage() {
  return (
    <>
      <Header
        title="Olfactory Data"
        subtitle="Molecule profiles, synergy maps, odor wheel & volatility curves"
      />
      <OlfactoryContent />
    </>
  );
}
