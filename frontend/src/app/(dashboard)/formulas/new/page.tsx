import { Header } from "@/components/layout/header";
import { FormulaBuilderWorkspace } from "@/components/formula/formula-builder-workspace";

export default function NewFormulaPage() {
  return (
    <>
      <Header title="New Formula" subtitle="Build your fragrance composition" />
      <FormulaBuilderWorkspace />
    </>
  );
}
