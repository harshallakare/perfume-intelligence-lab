import { Header } from "@/components/layout/header";
import { InventoryContent } from "@/components/inventory/inventory-content";

export default function InventoryPage() {
  return (
    <>
      <Header title="Inventory" subtitle="Raw materials, batches & stock management" />
      <InventoryContent />
    </>
  );
}
