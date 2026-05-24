import { Header } from "@/components/layout/header";
import { CloneContent } from "@/components/clone/clone-content";

export default function ClonePage() {
  return (
    <>
      <Header title="Clone Engine" subtitle="Dilution calculator — oil · alcohol · fixative blend recipes" />
      <CloneContent />
    </>
  );
}
