"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

// Snapshot mémoïsé : `useSyncExternalStore` compare les références.
let cache: { raw: string | null; value: ConsentState | null } = {
  raw: null,
  value: null,
};

function currentCookie(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${CONSENT_COOKIE}=`)) ?? null
  );
}

function getSnapshot(): ConsentState | null {
  const raw = currentCookie();
  if (raw !== cache.raw) cache = { raw, value: readConsent() };
  return cache.value;
}

const getServerSnapshot = (): ConsentState | null => null;

/** Consentement courant (réactif) + fonction d'enregistrement. */
export function useConsent() {
  const consent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const save = useCallback((state: ConsentState) => writeConsent(state), []);
  return { consent, save };
}
