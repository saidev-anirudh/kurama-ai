"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SpeechRecognitionEventArgs, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";

import type { AgentAction } from "@/lib/actions/agent-actions";
import { registerVoiceControls } from "@/store/voice-controls";
import { useVoiceStore } from "@/store/voice-store";

type BrowserRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<(ArrayLike<{ transcript: string }> & { isFinal?: boolean })> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserRecognitionLike;
    webkitSpeechRecognition?: new () => BrowserRecognitionLike;
  }
}

export function AssistantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const { mode, micAllowed, setMicAllowed, setMode, setActiveRoute } = useVoiceStore();
  const enableMicRef = useRef<() => Promise<void>>(async () => {});

  const recognitionRef = useRef<SpeechRecognizer | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTextRef = useRef("");
  const [query, setQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);
  const handlingUtteranceRef = useRef(false);
  const micAllowedRef = useRef(false);
  const browserRecognitionRef = useRef<BrowserRecognitionLike | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const greetedRef = useRef(false);
  const lastUtteranceRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const requestInFlightRef = useRef(false);
  const sttRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sttActiveRef = useRef(false);
  /** Resolves the in-flight ElevenLabs/browser-TTS promise when audio is paused or torn down (STT interrupt). */
  const ttsCompleteRef = useRef<(() => void) | null>(null);
  /** Monotonic id so a superseded askKurama finally block cannot clear state for a newer utterance. */
  const utteranceFlightRef = useRef(0);
  /** Aborts validate + orchestrate when a new utterance barges in. */
  const utterancePipelineAbortRef = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);

  const intro = useMemo(
    () =>
      "Hey I am Kurama Sais personal assistant Please enable microphone and ask me anything about Sai his work and life.",
    [],
  );

  function logVoice(stage: string, details?: unknown) {
    if (details !== undefined) {
      console.log(`[kurama-voice] ${stage}`, details);
      return;
    }
    console.log(`[kurama-voice] ${stage}`);
  }

  function stopActivePlayback() {
    ttsCompleteRef.current?.();
    ttsCompleteRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
  }

  function startListeningIfAvailable() {
    if (!micAllowedRef.current) return;
    if (recognitionRef.current) {
      if (sttActiveRef.current) return;
      recognitionRef.current.startContinuousRecognitionAsync(
        () => {
          sttActiveRef.current = true;
          logVoice("azure-stt-started");
        },
        (error) => logVoice("azure-stt-start-failed", error),
      );
      return;
    }
    if (browserRecognitionRef.current) {
      shouldKeepListeningRef.current = true;
      try {
        browserRecognitionRef.current.start();
        logVoice("browser-stt-started");
      } catch (error) {
        logVoice("browser-stt-start-failed", error);
      }
    }
  }

  async function refreshAzureSpeechToken() {
    try {
      const response = await fetch("/api/speech/token");
      if (!response.ok) {
        logVoice("azure-token-refresh-failed-http", response.status);
        return;
      }
      const { token } = (await response.json()) as { token: string; region: string };
      const recognizer = recognitionRef.current as unknown as { authorizationToken?: string } | null;
      if (recognizer) {
        recognizer.authorizationToken = token;
        logVoice("azure-token-refreshed");
      }
    } catch (error) {
      logVoice("azure-token-refresh-failed-network", error);
    }
  }

  function scheduleAzureRestart(reason: string) {
    if (!micAllowedRef.current || !recognitionRef.current) return;
    if (sttRestartTimerRef.current) clearTimeout(sttRestartTimerRef.current);
    sttRestartTimerRef.current = setTimeout(() => {
      logVoice("azure-stt-restart-attempt", reason);
      sttActiveRef.current = false;
      recognitionRef.current?.stopContinuousRecognitionAsync(
        () => startListeningIfAvailable(),
        () => startListeningIfAvailable(),
      );
    }, 350);
  }

  function speakWithBrowserTts(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      let settled = false;
      const complete = () => {
        if (settled) return;
        settled = true;
        ttsCompleteRef.current = null;
        speakingRef.current = false;
        resolve();
      };
      ttsCompleteRef.current = complete;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((voice) => /google us english|samantha|ava|zira|aria|female/i.test(voice.name)) ?? voices[0];
      if (preferred) {
        utterance.voice = preferred;
      }
      utterance.rate = 0.97;
      utterance.pitch = 1.02;
      speakingRef.current = true;
      utterance.onend = () => {
        logVoice("browser-tts-ended");
        complete();
      };
      utterance.onerror = () => {
        logVoice("browser-tts-error");
        complete();
      };
      logVoice("browser-tts-start");
      window.speechSynthesis.speak(utterance);
    });
  }

  async function speakWithElevenLabs(text: string) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        logVoice("elevenlabs-tts-http-error", response.status);
        await speakWithBrowserTts(text);
        return;
      }
      const blob = await response.blob();
      stopActivePlayback();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      speakingRef.current = true;
      await new Promise<void>((resolve) => {
        let settled = false;
        const complete = (reason: string) => {
          if (settled) return;
          settled = true;
          ttsCompleteRef.current = null;
          speakingRef.current = false;
          logVoice(reason);
          URL.revokeObjectURL(url);
          resolve();
        };
        ttsCompleteRef.current = () => complete("elevenlabs-tts-interrupted");
        audio.onended = () => complete("elevenlabs-tts-ended");
        audio.onerror = () => complete("elevenlabs-tts-audio-error");
        logVoice("elevenlabs-tts-start");
        void audio.play().catch(() => complete("elevenlabs-tts-play-failed"));
      });
    } catch (error) {
      logVoice("elevenlabs-tts-fallback-browser", error);
      await speakWithBrowserTts(text);
      speakingRef.current = false;
    }
  }

  function setupBrowserRecognitionFallback() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      logVoice("browser-stt-not-supported");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript?.trim();
      if (!transcript) return;
      if (!last.isFinal && speakingRef.current && audioRef.current && transcript.length >= 4) {
        logVoice("interrupting-active-tts-browser-interim");
        ttsCompleteRef.current?.();
        ttsCompleteRef.current = null;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        speakingRef.current = false;
      }
      if (last.isFinal) {
        if (speakingRef.current && audioRef.current) {
          logVoice("interrupting-active-tts-browser-stt");
          ttsCompleteRef.current?.();
          ttsCompleteRef.current = null;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          speakingRef.current = false;
        }
        logVoice("browser-stt-final", transcript);
        void askKurama(transcript);
      } else {
        setQuery(transcript);
        setMode("listening");
      }
    };
    recognition.onend = () => {
      logVoice("browser-stt-ended");
      if (shouldKeepListeningRef.current) {
        try {
          recognition.start();
          logVoice("browser-stt-restarted");
        } catch (error) {
          logVoice("browser-stt-restart-failed", error);
        }
      }
    };
    browserRecognitionRef.current = recognition;
    logVoice("browser-stt-ready");
  }

  async function validateSpeech(text: string, signal?: AbortSignal): Promise<{ valid: boolean; cleaned: string }> {
    if (handlingUtteranceRef.current) {
      logVoice("utterance-skipped-busy");
      return { valid: false, cleaned: "" };
    }
    handlingUtteranceRef.current = true;
    try {
      const response = await fetch("/api/kurama/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      });
      if (!response.ok) {
        logVoice("validate-http-error", response.status);
        return { valid: false, cleaned: "" };
      }
      const payload = (await response.json()) as { valid?: boolean; cleaned_text?: string };
      logVoice("validate-result", payload);
      return { valid: Boolean(payload.valid), cleaned: (payload.cleaned_text ?? "").trim() };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logVoice("validate-aborted");
        return { valid: false, cleaned: "" };
      }
      logVoice("validate-network-error", error);
      return { valid: false, cleaned: "" };
    } finally {
      handlingUtteranceRef.current = false;
    }
  }

  async function askKurama(rawText?: string) {
    const sourceText = (rawText ?? query).trim();
    if (!sourceText) return;
    const now = Date.now();
    const duplicateWindowMs = 1200;
    if (lastUtteranceRef.current.text === sourceText && now - lastUtteranceRef.current.at < duplicateWindowMs) {
      logVoice("utterance-skipped-duplicate", sourceText);
      return;
    }
    /** Block overlapping validate/orchestrate only (not TTS), unless barge-in aborts the prior flight. */
    if (requestInFlightRef.current && !speakingRef.current) {
      logVoice("utterance-barge-abort-pipeline");
      utterancePipelineAbortRef.current?.abort();
    }
    utterancePipelineAbortRef.current?.abort();
    const pipelineController = new AbortController();
    utterancePipelineAbortRef.current = pipelineController;
    const pipelineSignal = pipelineController.signal;

    const flightId = ++utteranceFlightRef.current;
    requestInFlightRef.current = true;
    lastUtteranceRef.current = { text: sourceText, at: now };
    const pipelineStart = performance.now();
    const validation = await validateSpeech(sourceText, pipelineSignal);
    if (!validation.valid || !validation.cleaned) {
      if (flightId === utteranceFlightRef.current) {
        requestInFlightRef.current = false;
        utterancePipelineAbortRef.current = null;
      }
      return;
    }
    const text = validation.cleaned;
    console.log("[kurama-transcript:user]", text);
    setMode("thinking");
    let scheduledAgentNav: string | null = null;
    try {
      const response = await fetch("/api/kurama/orchestrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal: pipelineSignal,
      });
      const payload = (await response.json()) as { speech_text: string; ui_actions: AgentAction[] };
      const pipelineMs = Math.round(performance.now() - pipelineStart);
      if (response.ok) {
        useVoiceStore.getState().setVoiceMetrics({ lastPipelineMs: pipelineMs });
      }
      if (!response.ok) {
        logVoice("orchestrate-http-error", payload);
        if (flightId === utteranceFlightRef.current) {
          requestInFlightRef.current = false;
          utterancePipelineAbortRef.current = null;
        }
        return;
      }
      /** Allow new STT utterances (barge-in / follow-up) while assistant speaks. */
      if (flightId === utteranceFlightRef.current) {
        requestInFlightRef.current = false;
      }
      utterancePipelineAbortRef.current = null;

      console.log("[kurama-transcript:assistant]", payload.speech_text);
      setMode("speaking");

      for (const action of payload.ui_actions) {
        if (action.type === "present" && action.payload.component === "contact_message_draft") {
          sessionStorage.setItem("kurama_contact_draft", JSON.stringify(action.payload.props ?? {}));
          logVoice("contact-draft-presented", action.payload.props ?? {});
        }
      }

      const navTargets = payload.ui_actions.filter((a): a is Extract<AgentAction, { type: "navigate" }> => a.type === "navigate");
      if (navTargets.length > 1) {
        logVoice("multiple-navigate-actions", { count: navTargets.length, using: navTargets[0]?.payload.to });
      }
      const primaryNav = navTargets[0]?.payload.to ?? null;
      const navDelayMs = 520;

      if (primaryNav) {
        scheduledAgentNav = primaryNav;
        try {
          void router.prefetch(primaryNav);
        } catch {
          // prefetch is best-effort
        }
        useVoiceStore.getState().setAgentNavVeil(true, primaryNav);
        window.setTimeout(() => {
          setActiveRoute(primaryNav);
          document.body.classList.add("scene-transition");
          startTransition(() => {
            router.push(primaryNav);
          });
          window.setTimeout(() => document.body.classList.remove("scene-transition"), 620);
          window.setTimeout(() => {
            useVoiceStore.getState().setAgentNavVeil(false, null);
          }, 880);
        }, navDelayMs);
      }

      await speakWithElevenLabs(payload.speech_text);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logVoice("orchestrate-or-validate-aborted");
        return;
      }
      throw error;
    } finally {
      if (flightId === utteranceFlightRef.current) {
        utterancePipelineAbortRef.current = null;
      }
      if (!scheduledAgentNav) {
        useVoiceStore.getState().setAgentNavVeil(false, null);
      }
      if (flightId === utteranceFlightRef.current) {
        requestInFlightRef.current = false;
      }
      setMode(micAllowedRef.current ? "listening" : "idle");
      setQuery("");
    }
  }

  async function enableMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      micAllowedRef.current = true;
      setMode("speaking");
      if (!greetedRef.current) {
        greetedRef.current = true;
        await speakWithElevenLabs(intro);
      } else {
        await speakWithElevenLabs("Neural uplink restored. I am listening.");
      }
      startListeningIfAvailable();
      setTimeout(() => setMode("listening"), 350);
    } catch (error) {
      logVoice("mic-enable-failed", error);
      setMicAllowed(false);
      micAllowedRef.current = false;
    }
  }

  enableMicRef.current = enableMic;

  useEffect(() => {
    registerVoiceControls({
      ready,
      enableMic: async () => enableMicRef.current(),
    });
  }, [ready]);

  useEffect(() => {
    micAllowedRef.current = micAllowed;
  }, [micAllowed]);

  useEffect(() => {
    document.body.classList.toggle("home-route", isHome);
    return () => document.body.classList.remove("home-route");
  }, [isHome]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setReady(true);
      setMode("idle");

      setupBrowserRecognitionFallback();
      const tokenResponse = await fetch("/api/speech/token");
      if (!tokenResponse.ok) {
        const tokenErr = await tokenResponse.text();
        logVoice("azure-token-failed", tokenErr);
        return;
      }
      const { token, region } = (await tokenResponse.json()) as { token: string; region: string };
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      if (!mounted) return;
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = "en-US";
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
      ["Sai Dev Anirudh", "Chat360", "LangGraph", "GraphRAG", "Agentic RAG", "Asterisk", "Qdrant", "Career timeline", "Voice AI", "Kurama"].forEach(
        (phrase) => phraseList.addPhrase(phrase),
      );

      recognizer.recognizing = (_, event: SpeechRecognitionEventArgs) => {
        const liveText = event.result?.text;
        if (!liveText) return;
        liveTextRef.current = liveText;
        setQuery(liveText);
        setMode("listening");
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        /** Shorter tail while TTS plays so barge-in / new intent commits faster; longer when idle to reduce false triggers. */
        const endSilenceMs = speakingRef.current ? 680 : 980;
        silenceTimerRef.current = setTimeout(() => {
          const buffered = liveTextRef.current.trim();
          if (buffered) {
            if (speakingRef.current && audioRef.current) {
              logVoice("interrupting-active-tts-azure-interim");
              ttsCompleteRef.current?.();
              ttsCompleteRef.current = null;
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              speakingRef.current = false;
            }
            void askKurama(buffered);
            liveTextRef.current = "";
          }
        }, endSilenceMs);
      };
      recognizer.recognized = (_, event: SpeechRecognitionEventArgs) => {
        const transcript = event.result?.text?.trim();
        if (transcript) {
          if (speakingRef.current && audioRef.current) {
            logVoice("interrupting-active-tts-azure-final");
            ttsCompleteRef.current?.();
            ttsCompleteRef.current = null;
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            speakingRef.current = false;
          }
          liveTextRef.current = "";
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          logVoice("azure-stt-final", transcript);
          void askKurama(transcript);
        }
      };
      recognizer.canceled = (_, event) => {
        sttActiveRef.current = false;
        logVoice("azure-stt-canceled", { reason: event.reason, errorCode: event.errorCode, errorDetails: event.errorDetails });
        scheduleAzureRestart("canceled");
      };
      recognizer.sessionStarted = () => logVoice("azure-stt-session-started");
      recognizer.sessionStopped = () => {
        sttActiveRef.current = false;
        logVoice("azure-stt-session-stopped");
        scheduleAzureRestart("session-stopped");
      };
      recognitionRef.current = recognizer;
      logVoice("azure-stt-ready");
      if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = setInterval(() => {
        void refreshAzureSpeechToken();
      }, 8 * 60 * 1000);
      startListeningIfAvailable();
    })();

    return () => {
      mounted = false;
      shouldKeepListeningRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      sttActiveRef.current = false;
      if (sttRestartTimerRef.current) clearTimeout(sttRestartTimerRef.current);
      if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
      stopActivePlayback();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.stopContinuousRecognitionAsync();
      recognitionRef.current?.close();
      browserRecognitionRef.current?.stop();
    };
  }, []);

  return (
    <>
      {children}
      <span className="sr-only" aria-live="polite">
        {micAllowed ? `Kurama voice ${mode}` : "Kurama voice idle"}
      </span>
    </>
  );
}
