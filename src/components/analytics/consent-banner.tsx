"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  CONSENT_OPEN_EVENT,
  DENIED_ALL,
  GRANTED_ALL,
  type ConsentState,
} from "@/lib/consent";
import { routes } from "@/content/site";
import { useConsent } from "./use-consent";

export function ConsentBanner() {
  const { consent, save } = useConsent();
  const [dismissed, setDismissed] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(DENIED_ALL);
  const titleId = useId();

  useEffect(() => {
    const reopen = () => {
      setDraft(consent ?? DENIED_ALL);
      setDetails(true);
      setForceOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, [consent]);

  const open = forceOpen || (consent === null && !dismissed);
  if (!open) return null;

  const decide = (state: ConsentState) => {
    save(state);
    setForceOpen(false);
    setDismissed(true);
    setDetails(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 border-t-[6px] border-brand bg-ink text-white shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
    >
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <p id={titleId} className="text-sm font-medium">
          Cookies et mesure d’audience
        </p>
        <p className="mt-1.5 text-sm text-white/70">
          Nous utilisons des cookies pour mesurer l’audience du site et, avec
          votre accord, améliorer nos campagnes. Le nécessaire au fonctionnement
          reste toujours actif.{" "}
          <Link href={routes.cookies} className="underline hover:text-white">
            Politique de cookies
          </Link>
        </p>

        {details && (
          <div className="mt-4 grid gap-3 border-t border-white/15 pt-4 text-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, analytics: e.target.checked }))
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Mesure d’audience</span>
                <span className="block text-white/60">
                  Statistiques de visite anonymisées (Google Analytics).
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draft.marketing}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, marketing: e.target.checked }))
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Marketing</span>
                <span className="block text-white/60">
                  Mesure des campagnes Google Ads et Meta.
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => decide(GRANTED_ALL)}
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-bright"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={() => decide(DENIED_ALL)}
            className="rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white hover:border-white"
          >
            Continuer sans accepter
          </button>
          {details ? (
            <button
              type="button"
              onClick={() => decide(draft)}
              className="rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white hover:border-white"
            >
              Enregistrer mes choix
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(consent ?? DENIED_ALL);
                setDetails(true);
              }}
              className="rounded-full px-5 py-2 text-sm font-medium text-white/70 underline hover:text-white"
            >
              Personnaliser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Bouton « Gérer les cookies » pour le pied de page. */
export function ConsentManageButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className}
    >
      Gérer les cookies
    </button>
  );
}
