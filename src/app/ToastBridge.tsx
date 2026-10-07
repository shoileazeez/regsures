"use client";
import { useEffect, useState } from "react";
type Toast = { id: number; kind: "success" | "error"; message: string };
export function showToast(message: string, kind: Toast["kind"] = "success") {
  window.dispatchEvent(
    new CustomEvent("regsure:toast", {
      detail: { id: Date.now(), kind, message },
    }),
  );
}
export default function ToastBridge() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as Toast;
      setToasts((x) => [...x, detail]);
      setTimeout(
        () => setToasts((x) => x.filter((t) => t.id !== detail.id)),
        4200,
      );
    };
    window.addEventListener("regsure:toast", handler);
    return () => window.removeEventListener("regsure:toast", handler);
  }, []);
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast toast-${t.kind}`} key={t.id}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
