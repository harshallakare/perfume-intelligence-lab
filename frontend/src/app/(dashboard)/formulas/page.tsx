import { Header } from "@/components/layout/header";
import { FormulasContent } from "@/components/formula/formulas-content";

export default function FormulasPage() {
  return (
    <>
      <Header title="Formula Builder" subtitle="Create, version and manage perfume formulas" />
      <FormulasContent />
    </>
  );
}
