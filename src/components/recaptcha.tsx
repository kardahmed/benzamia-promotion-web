"use client";

import { useCallback, useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
export const recaptchaEnabled = SITE_KEY.length > 0;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!recaptchaEnabled) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("reCAPTCHA introuvable"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Charge reCAPTCHA v3 au montage et fournit `execute(action)` → token
 * (ou `null` si la fonctionnalité n'est pas configurée / indisponible).
 */
export function useRecaptcha() {
  const primed = useRef(false);

  useEffect(() => {
    if (recaptchaEnabled && !primed.current) {
      primed.current = true;
      loadScript().catch(() => {});
    }
  }, []);

  return useCallback(async (action: string): Promise<string | null> => {
    if (!recaptchaEnabled) return null;
    try {
      await loadScript();
      const g = window.grecaptcha;
      if (!g) return null;
      await new Promise<void>((r) => g.ready(() => r()));
      return await g.execute(SITE_KEY, { action });
    } catch {
      return null;
    }
  }, []);
}

/** Mention légale obligatoire lorsque le badge flottant reCAPTCHA est masqué. */
export function RecaptchaNotice() {
  if (!recaptchaEnabled) return null;
  return (
    <p className="text-xs text-grey">
      Ce formulaire est protégé par reCAPTCHA : la{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        politique de confidentialité
      </a>{" "}
      et les{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        conditions d’utilisation
      </a>{" "}
      de Google s’appliquent.
    </p>
  );
}
