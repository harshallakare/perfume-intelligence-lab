import { Header } from "@/components/layout/header";
import { CostingContent } from "@/components/costing/costing-content";

export default function CostingPage() {
  return (
    <>
      <Header
        title="Costing"
        subtitle="Formula cost analysis, margins & pricing tiers"
      />
      <CostingContent />
    </>
  );
}
