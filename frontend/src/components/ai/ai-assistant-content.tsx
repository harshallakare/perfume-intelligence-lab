"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FlaskConical, Loader2, Bot, User, Settings, ChevronDown, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  formula?: { name: string; ingredients: { section: string; material: string; pct: number }[] };
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Create a masculine woody oriental EDP, similar to Dior Sauvage but smokier, with 20%+ longevity and budget under $0.40/ml",
  "Suggest fixatives for a floral rose formula that's losing longevity",
  "What molecules work well with ISO E Super to boost projection?",
  "Generate a blue aquatic fougere with fresh laundry musk base",
  "How can I improve the dry-down of my amber attar?",
  "Substitute ideas for Ambroxan in a budget formula",
];

const MOCK_RESPONSE = `I've analyzed your request and here's a masculine woody oriental EDP formula:

**Formula: Dark Vetiver Woods**

**Top Notes (15%)**
- Dihydromyrcenol 10% — fresh, metallic citrus opener
- Pink Pepper EO 3% — spicy lift
- Lemon Terpenes 2% — bright citrus

**Heart Notes (35%)**
- ISO E Super 12% — cedarwood, woody radiance
- Hedione HC 8% — clean floral diffuser
- Violet Leaf Absolute 5% — green, smoky character
- Cashmeran 5% — soft cashmere warmth
- Birch Tar 5% — smoky depth ⚠️ Use carefully — IFRA restricted

**Base Notes (50%)**
- Ambroxan 4% — ambergris radiance, skin scent
- Ethylene Brassylate 5% — clean musky foundation
- Iso E Super (base layer) 8% — woody depth
- Vetiver Haitian EO 3% — smoky, earthy
- Labdanum Resinoid 4% — amber, animalic
- Benzyl Benzoate 8% — fixative, balsamic
- Coumarin 3% — hay, tonka warmth
- DPG 15% — carrier/fixative

**Performance Estimates**
- Longevity: 9–12h on skin
- Projection: 8/10 (first 2h), settles to 6/10
- Sillage: 7/10

**Cost Estimate:** ~$0.38/ml (within budget)

**IFRA Note:** Birch Tar is restricted to 1.2% max in fine fragrance (Cat 11a). I've set it at 5% — you should reduce to 1.2% and compensate with additional Vetiver.

Would you like me to adjust the formula, suggest alternatives for any ingredient, or calculate the full batch amounts?`;

export function AIAssistantContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Perfume Formulation Assistant. I can help you create formulas, suggest molecules, optimize blends, identify fixatives, check IFRA compliance, and much more.\n\nTell me what you'd like to create, or choose a quick prompt below.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-7");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 1800));

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: MOCK_RESPONSE,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginTop: i > 0 ? 10 : 0, marginBottom: 4 }}>
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (line.startsWith("- ")) {
        const parts = line.slice(2).split(" — ");
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, paddingLeft: 8 }}>
            <span style={{ color: "rgba(201,168,76,0.5)", flexShrink: 0 }}>•</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              <strong style={{ color: "#ffffff" }}>{parts[0]}</strong>
              {parts[1] && <span style={{ color: "rgba(255,255,255,0.5)" }}> — {parts[1]}</span>}
            </span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
      return (
        <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 3 }}>
          {line}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        flex: 1,
        height: "calc(100vh - 60px)",
        overflow: "hidden",
      }}
    >
      {/* Main chat area */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Model selector bar */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <Sparkles size={14} style={{ color: "#a78bfa" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Provider:</span>
          <select
            className="select-base"
            style={{ width: 130, padding: "4px 28px 4px 10px", height: 30 }}
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {["anthropic", "openai", "gemini", "ollama", "deepseek"].map((p) => (
              <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <select
            className="select-base"
            style={{ width: 180, padding: "4px 28px 4px 10px", height: 30 }}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {selectedProvider === "anthropic" && ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"].map((m) => <option key={m} value={m}>{m}</option>)}
            {selectedProvider === "openai" && ["gpt-4o", "gpt-4o-mini", "o1-preview"].map((m) => <option key={m} value={m}>{m}</option>)}
            {selectedProvider === "gemini" && ["gemini-1.5-pro", "gemini-1.5-flash"].map((m) => <option key={m} value={m}>{m}</option>)}
            {selectedProvider === "ollama" && ["llama3.1:70b", "mixtral:8x7b"].map((m) => <option key={m} value={m}>{m}</option>)}
            {selectedProvider === "deepseek" && ["deepseek-r1", "deepseek-v3"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => setMessages([messages[0]])}
          >
            <RotateCcw size={12} /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: msg.role === "user" ? "rgba(201,168,76,0.2)" : "rgba(168,85,247,0.2)",
                  border: `1px solid ${msg.role === "user" ? "rgba(201,168,76,0.3)" : "rgba(168,85,247,0.3)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {msg.role === "user" ? (
                  <User size={14} color="#c9a84c" />
                ) : (
                  <Bot size={14} color="#a855f7" />
                )}
              </div>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "80%",
                  padding: "14px 16px",
                  background: msg.role === "user" ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${msg.role === "user" ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                }}
              >
                {msg.role === "assistant" ? (
                  <div>{formatContent(msg.content)}</div>
                ) : (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{msg.content}</div>
                )}
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 8, textAlign: msg.role === "user" ? "right" : "left" }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(168,85,247,0.2)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bot size={14} color="#a855f7" />
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px 12px 12px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Loader2 size={14} color="#a855f7" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {selectedModel} is formulating…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(5,5,15,0.8)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "10px 14px",
              transition: "border-color 0.15s",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Describe what you want to create, ask for suggestions, substitutions…"
              rows={2}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: 13,
                resize: "none",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
              }}
            />
            <button
              className="btn-primary"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{ height: 36, padding: "0 14px", flexShrink: 0 }}
            >
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
            Enter to send · Shift+Enter for new line · AI context includes your inventory &amp; IFRA data
          </div>
        </div>
      </div>

      {/* Right sidebar: Quick prompts + context */}
      <div
        style={{
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          overflowY: "auto",
          padding: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Quick Prompts
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              className="btn-ghost"
              onClick={() => sendMessage(p)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                lineHeight: 1.4,
                whiteSpace: "normal",
                height: "auto",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 24, marginBottom: 12 }}>
          AI Context
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Inventory access", status: true, detail: "188 materials" },
            { label: "IFRA 51st data", status: true, detail: "Current amendment" },
            { label: "Formula library", status: true, detail: "54 formulas" },
            { label: "Olfactory data", status: true, detail: "Molecule profiles" },
            { label: "Pricing data", status: true, detail: "Live costs" },
          ].map((ctx) => (
            <div
              key={ctx.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                background: "rgba(255,255,255,0.025)",
                borderRadius: 7,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ctx.status ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{ctx.label}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{ctx.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
