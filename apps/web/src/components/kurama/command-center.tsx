"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { KuramaOrb } from "@/components/kurama/orb";
import type { AgentAction } from "@/lib/actions/agent-actions";
import { useVoiceStore } from "@/store/voice-store";

const QUICK_ROUTES = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Career Timeline", href: "/career-timeline" },
  { label: "Passions", href: "/passions" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const GATEWAY_URL = process.env.NEXT_PUBLIC_KURAMA_GATEWAY_URL ?? "http://localhost:8080";

export function KuramaCommandCenter() {
  const router = useRouter();
  const {
    mode,
    micAllowed,
    transcripts,
    setMicAllowed,
    setMode,
    addTranscript,
    setActiveRoute,
  } = useVoiceStore();
  const [query, setQuery] = useState("");

  const intro = useMemo(
    () =>
      "Hey, I'm Kurama, Sai's personal assistant. What would you like to know about Sai's life, work, and passions?",
    [],
  );

  async function enableMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      setMode("speaking");
      addTranscript({ id: crypto.randomUUID(), role: "kurama", text: intro });
      setTimeout(() => setMode("idle"), 800);
    } catch {
      setMicAllowed(false);
    }
  }

  function runQuickRoute(href: string) {
    setMode("thinking");
    setTimeout(() => {
      setMode("speaking");
      addTranscript({
        id: crypto.randomUUID(),
        role: "kurama",
        text: `Routing you to ${href.replace("/", "") || "home"}.`,
      });
      setActiveRoute(href);
      router.push(href);
      setTimeout(() => setMode("idle"), 500);
    }, 250);
  }

  function applyAction(action: AgentAction) {
    if (action.type === "navigate") {
      setActiveRoute(action.payload.to);
      router.push(action.payload.to);
    }
  }

  async function askKurama() {
    if (!query.trim()) return;
    addTranscript({ id: crypto.randomUUID(), role: "user", text: query });
    setMode("thinking");
    try {
      const response = await fetch(`${GATEWAY_URL}/orchestrate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const payload = (await response.json()) as {
        speech_text: string;
        ui_actions: AgentAction[];
      };
      setMode("speaking");
      addTranscript({ id: crypto.randomUUID(), role: "kurama", text: payload.speech_text });
      payload.ui_actions.forEach(applyAction);
    } catch {
      addTranscript({
        id: crypto.randomUUID(),
        role: "kurama",
        text: "I couldn't reach the orchestration service. Try again after backend starts.",
      });
    } finally {
      setMode("idle");
      setQuery("");
    }
  }

  return (
    <section className="hud-panel">
      <h1>Kurama Voice Portfolio</h1>
      <p className="muted">
        Futuristic voice-first assistant with LangGraph agent routing.
      </p>

      <KuramaOrb state={mode} />

      <div className="actions">
        <button className="btn-primary" onClick={enableMic} type="button">
          {micAllowed ? "Microphone Ready" : "Enable Microphone"}
        </button>
        <button className="btn-secondary" onClick={() => setMode("listening")} type="button">
          Simulate Listening
        </button>
      </div>

      <div className="quick-grid">
        {QUICK_ROUTES.map((route) => (
          <button
            className="route-chip"
            key={route.href}
            onClick={() => runQuickRoute(route.href)}
            type="button"
          >
            {route.label}
          </button>
        ))}
      </div>

      <div className="query-row">
        <input
          className="query-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask Kurama: show me Sai's projects"
          value={query}
        />
        <button className="btn-primary" onClick={askKurama} type="button">
          Ask Kurama
        </button>
      </div>

      <div className="transcript-panel">
        <h2>Live Transcript</h2>
        {transcripts.length === 0 ? (
          <p className="muted">No transcript yet. Start by enabling microphone.</p>
        ) : (
          transcripts.map((line) => (
            <p key={line.id}>
              <strong>{line.role === "kurama" ? "Kurama:" : "User:"}</strong> {line.text}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
