import { Header } from "@/components/layout/header";
import { ProductionContent } from "@/components/production/production-content";

export default function ProductionPage() {
  return (
    <>
      <Header title="Production" subtitle="Batch manufacturing, maceration tracking & QC" />
      <ProductionContent />
    </>
  );
}
