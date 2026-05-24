import { Header } from "@/components/layout/header";
import { AccordsContent } from "@/components/accords/accords-content";

export default function AccordsPage() {
  return (
    <>
      <Header
        title="Accord Library"
        subtitle="Pre-built and custom fragrance accord blocks — the building blocks of your formulas"
      />
      <AccordsContent />
    </>
  );
}
