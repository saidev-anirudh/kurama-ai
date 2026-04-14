"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { profile } from "@/lib/content/resume";

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

export function ContactCard() {
  const [fromEmail, setFromEmail] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("kurama_contact_draft");
    if (!raw) return;
    sessionStorage.removeItem("kurama_contact_draft");
    try {
      const parsed = JSON.parse(raw) as { subject?: string; body?: string };
      if (parsed.subject) setSubject(parsed.subject);
      if (parsed.body) setBody(parsed.body);
      if (parsed.body) setDraftNotes(parsed.body);
    } catch {
      // Ignore malformed session payload.
    }
  }, []);

  function captureVoiceDraft() {
    const Recognition =
      ((window as Window & { SpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ??
        (window as Window & { webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition);
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setDraftNotes((prev) => `${prev} ${transcript}`.trim());
    };
    recognition.start();
  }

  async function composeMessage() {
    setComposing(true);
    const response = await fetch("/api/contact/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromEmail, draftNotes }),
    });
    setComposing(false);
    if (!response.ok) return;
    const payload = (await response.json()) as { subject: string; body: string };
    setSubject(payload.subject);
    setBody(payload.body);
  }

  async function sendMessage() {
    const response = await fetch("/api/contact/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromEmail, subject, body }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { mailto: string };
    window.location.href = payload.mailto;
  }

  return (
    <section className="content-page">
      <p className="hud-eyebrow">Uplink</p>
      <h1>Contact</h1>
      <p className="hud-subtitle muted">Open to hiring, collaboration, speaking, and consulting requests.</p>
      <div className="contact-grid">
        <a href={`mailto:${profile.email}`}>Email</a>
        <a href={`tel:${profile.phone}`}>Call</a>
        <a href="https://github.com/saidev-anirudh">GitHub</a>
        <a href="https://www.linkedin.com/in/sai-dev-anirudh-thatode-055702223/">LinkedIn</a>
      </div>

      <h2>Voice Draft to Email (HITL)</h2>
      <p className="muted">Speak your draft, review generated content, then click Send.</p>
      <div className="query-row">
        <input
          className="query-input"
          placeholder="Your email"
          value={fromEmail}
          onChange={(event) => setFromEmail(event.target.value)}
        />
      </div>
      <div className="query-row">
        <textarea
          className="query-input"
          placeholder="Speak or type your message draft"
          value={draftNotes}
          onChange={(event) => setDraftNotes(event.target.value)}
          rows={4}
        />
      </div>
      <div className="actions">
        <button className="btn-secondary" onClick={captureVoiceDraft} type="button">
          Capture Voice Draft
        </button>
        <button className="btn-primary" onClick={composeMessage} type="button" disabled={composing}>
          {composing ? "Composing..." : "Prepare Draft"}
        </button>
      </div>

      {subject || body ? (
        <div className={cn("transcript-panel", "transcript-panel--open")}>
          <h3>Review Before Send</h3>
          <p>
            <strong>Subject:</strong> {subject}
          </p>
          <textarea
            className="query-input"
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="actions" style={{ marginTop: "0.6rem" }}>
            <button className="btn-primary" onClick={sendMessage} type="button">
              Send
            </button>
          </div>
        </div>
      ) : null}

      <h2>LinkedIn Connector</h2>
      <p className="muted">
        Connect with Sai on LinkedIn for hiring and collaboration:
        {" "}
        <a href="https://www.linkedin.com/in/sai-dev-anirudh-thatode-055702223/" target="_blank" rel="noreferrer">
          Open LinkedIn Profile
        </a>
      </p>
      <div className="contact-grid">
        <a href="https://www.linkedin.com/in/sai-dev-anirudh-thatode-055702223/" target="_blank" rel="noreferrer">
          Open LinkedIn
        </a>
      </div>
    </section>
  );
}
