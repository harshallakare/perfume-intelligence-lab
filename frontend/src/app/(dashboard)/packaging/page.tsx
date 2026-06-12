import { Header } from "@/components/layout/header";
import { PackagingContent } from "@/components/packaging/packaging-content";

export default function PackagingPage() {
  return (
    <>
      <Header title="Packaging & Supplies" subtitle="Bottles, caps, sprayers, boxes & other non-consumable stock" />
      <PackagingContent />
    </>
  );
}
