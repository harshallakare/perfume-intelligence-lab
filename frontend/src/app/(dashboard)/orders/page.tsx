import { Header } from "@/components/layout/header";
import { OrdersContent } from "@/components/orders/orders-content";

export default function OrdersPage() {
  return (
    <>
      <Header title="Orders" subtitle="Sales orders, invoicing, payments & fulfilment" />
      <OrdersContent />
    </>
  );
}
