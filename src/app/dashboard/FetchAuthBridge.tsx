"use client";
import { useEffect } from "react";
export default function FetchAuthBridge() {
  useEffect(() => {
    const original = window.fetch.bind(window);
    let refresh: Promise<Response> | null = null;
    window.fetch = async (input, init) => {
      const method = (init?.method || "GET").toUpperCase();
      const button =
        method !== "GET" && document.activeElement instanceof HTMLButtonElement
          ? document.activeElement
          : null;
      const text = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }
      try {
        let response = await original(input, init);
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : "";
        if (method !== "GET" && url.startsWith("/api/")) {
          response
            .clone()
            .json()
            .then((data) => {
              const message =
                data?.error ||
                data?.message ||
                (response.ok && data?.ok ? "Saved successfully." : null);
              if (message)
                window.dispatchEvent(
                  new CustomEvent("regsure:toast", {
                    detail: {
                      id: Date.now() + Math.random(),
                      kind: response.ok ? "success" : "error",
                      message,
                    },
                  }),
                );
            })
            .catch(() => {});
        }
        if (
          response.status !== 401 ||
          url.includes("/api/auth/refresh") ||
          url.includes("/api/auth/login") ||
          url.includes("/api/auth/signup") ||
          (init as any)?.__retried
        )
          return response;
        refresh ??= original("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        }).finally(() => {
          refresh = null;
        });
        const refreshed = await refresh;
        if (!refreshed.ok) return response;
        return original(input, {
          ...(init || {}),
          credentials: "include",
          __retried: true,
        } as RequestInit);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = text || "Submit";
        }
      }
    };
    return () => {
      window.fetch = original;
    };
  }, []);
  return null;
}
