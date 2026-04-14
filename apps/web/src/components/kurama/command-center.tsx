"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SpeechRecognizer, SpeechRecognitionEventArgs } from "microsoft-cognitiveservices-speech-sdk";

import { KuramaOrb } from "@/components/kurama/orb";
import type { AgentAction } from "@/lib/actions/agent-actions";
import { profile } from "@/lib/content/resume";
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
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_KURAMA_API_TOKEN;

export function KuramaCommandCenter() {
  const router = useRouter();
  const {
    mode,
    micAllowed,
    setMicAllowed,
    setMode,
    addTranscript,
    setActiveRoute,
  } = useVoiceStore();
  const [query, setQuery] = useState("");
  const recognitionRef = useRef<SpeechRecognizer | null>(null);
  const autoStartedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTextRef = useRef("");

  const intro = useMemo(
    () =>
      "Hey, I'm Kurama, Sai's personal assistant. Please enable microphone so we can start speaking. You can ask me about Sai's work, projects, and career timeline.",
    [],
  );

  async function enableMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      setMode("speaking");
      addTranscript({ id: crypto.randomUUID(), role: "kurama", text: intro });
      await speakWithElevenLabs(intro);
      recognitionRef.current?.startContinuousRecognitionAsync();
      setTimeout(() => setMode("listening"), 400);
    } catch {
      setMicAllowed(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokenResponse = await fetch("/api/speech/token");
        if (!tokenResponse.ok) return;
        const { token, region } = (await tokenResponse.json()) as { token: string; region: string };
        const sdk = await import("microsoft-cognitiveservices-speech-sdk");
        if (!mounted) return;

        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechRecognitionLanguage = "en-US";
        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
        [
          "Sai Dev Anirudh",
          "Chat360",
          "LangGraph",
          "GraphRAG",
          "Agentic RAG",
          "Asterisk",
          "Qdrant",
          "Career timeline",
          "Voice AI",
          "Kurama",
        ].forEach((phrase) => phraseList.addPhrase(phrase));

        recognizer.recognizing = (_, event: SpeechRecognitionEventArgs) => {
          const liveText = event.result?.text;
          if (liveText) {
            liveTextRef.current = liveText;
            setQuery(liveText);
            setMode("listening");
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              const buffered = liveTextRef.current.trim();
              if (buffered) {
                void askKurama(buffered);
                liveTextRef.current = "";
              }
            }, 1600);
          }
        };
        recognizer.recognized = (_, event: SpeechRecognitionEventArgs) => {
          const transcript = event.result?.text?.trim();
          if (transcript) {
            setQuery(transcript);
            void askKurama(transcript);
            liveTextRef.current = "";
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          }
        };
        recognitionRef.current = recognizer;
      } catch {
        // Keep typed fallback when speech token/sdk is unavailable.
      }
    })();

    return () => {
      mounted = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.stopContinuousRecognitionAsync();
      recognitionRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    setMode("speaking");
    addTranscript({ id: crypto.randomUUID(), role: "kurama", text: intro });
    void speakWithElevenLabs(intro).finally(() => setMode("idle"));
  }, [addTranscript, intro, setMode]);

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
      document.body.classList.add("scene-transition");
      window.setTimeout(() => document.body.classList.remove("scene-transition"), 550);
      router.push(action.payload.to);
    }
  }

  async function speakWithElevenLabs(text: string) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) return;
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch {
      // TTS is optional; UI still functions without it.
    }
  }

  async function askKurama(rawText?: unknown) {
    const text = typeof rawText === "string" ? rawText.trim() : query.trim();
    if (!text) return;
    console.log("[kurama-transcript:user]", text);
    addTranscript({ id: crypto.randomUUID(), role: "user", text });
    setMode("thinking");
    try {
      const response = await fetch(`${GATEWAY_URL}/orchestrate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as {
        speech_text: string;
        ui_actions: AgentAction[];
      };
      setMode("speaking");
      addTranscript({ id: crypto.randomUUID(), role: "kurama", text: payload.speech_text });
      console.log("[kurama-transcript:assistant]", payload.speech_text);
      await speakWithElevenLabs(payload.speech_text);
      payload.ui_actions.forEach(applyAction);
    } catch {
      addTranscript({
        id: crypto.randomUUID(),
        role: "kurama",
        text: "I couldn't reach the orchestration service. Try again after backend starts.",
      });
    } finally {
      setMode(micAllowed ? "listening" : "idle");
      setQuery("");
    }
  }

  return (
    <section className="hud-panel">
      <h1>Kurama Voice Portfolio</h1>
      <p className="muted">
        Futuristic voice-first assistant with LangGraph agent routing.
      </p>
      <p className="muted">
        {profile.name} - Voice AI Lead. Enable mic once; Kurama will stay continuously interactive.
      </p>

      <KuramaOrb state={mode} />

      <div className="actions">
        <button className="btn-primary" onClick={enableMic} type="button">
          {micAllowed ? "Microphone Ready" : "Enable Microphone"}
        </button>
        {micAllowed ? <span className="muted">Continuous listening active</span> : null}
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
        <button className="btn-primary" onClick={() => void askKurama()} type="button">
          Ask Kurama
        </button>
      </div>

      <p className="muted">Live transcript hidden from UI. View interaction logs in CLI/browser console.</p>
    </section>
  );
}
