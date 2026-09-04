import { useState } from "react";

export function speakWord(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN";
  u.rate = 0.85;
  const voice = window.speechSynthesis
    .getVoices()
    .find(v => v.lang === "en-IN") ?? window.speechSynthesis.getVoices().find(v => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

export function SpeakButton({ text, label }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Listen to the word ${label ?? text}`}
      onClick={() => {
        if (speakWord(text)) {
          setPlaying(true);
          window.setTimeout(() => setPlaying(false), 900);
        }
      }}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-lg shadow-soft transition hover:scale-110 ${
        playing ? "scale-110 ring-2 ring-primary" : ""
      }`}
    >
      🔊
    </button>
  );
}
