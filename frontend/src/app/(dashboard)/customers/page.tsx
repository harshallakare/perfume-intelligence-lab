import { Header } from "@/components/layout/header";
import { CustomersContent } from "@/components/customers/customers-content";

export default function CustomersPage() {
  return (
    <>
      <Header title="Customers" subtitle="Retail, wholesale & distributor accounts" />
      <CustomersContent />
    </>
  );
}
