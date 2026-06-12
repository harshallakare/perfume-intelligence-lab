import { Header } from "@/components/layout/header";
import { ProductsContent } from "@/components/products/products-content";

export default function ProductsPage() {
  return (
    <>
      <Header title="Products" subtitle="Finished-goods stock, pricing, margins & batch profitability" />
      <ProductsContent />
    </>
  );
}
