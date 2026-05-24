import { Header } from "@/components/layout/header";
import { AIAssistantContent } from "@/components/ai/ai-assistant-content";

export default function AIAssistantPage() {
  return (
    <>
      <Header title="AI Assistant" subtitle="AI-powered perfume formulation guidance" />
      <AIAssistantContent />
    </>
  );
}
