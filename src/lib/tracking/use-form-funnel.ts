"use client";

import { useCallback, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Entonnoir de formulaire — cahier des charges V2 §13.
 *
 *   form_start   : premier focus dans le formulaire
 *   form_submit  : tentative d'envoi
 *   form_error   : le serveur a refusé (avec le motif / le champ)
 *   form_abandon : l'onglet est quitté après un form_start sans envoi réussi
 *
 * `extra` est fusionné dans chaque événement (ex. { project: "residence-..." }).
 */
export function useFormFunnel(
  formName: string,
  extra: Record<string, unknown> = {},
) {
  const started = useRef(false);
  const completed = useRef(false);
  // `extra` est recréé à chaque rendu : on le garde dans une ref pour ne pas
  // réenregistrer l'écouteur `visibilitychange` à chaque frappe.
  const extraRef = useRef(extra);
  useEffect(() => {
    extraRef.current = extra;
  });

  const base = useCallback(
    () => ({ form_name: formName, ...extraRef.current }),
    [formName],
  );

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    track("form_start", base());
  }, [base]);

  const submit = useCallback(() => {
    track("form_submit", base());
  }, [base]);

  const error = useCallback(
    (reason: string, fields?: string) => {
      track("form_error", { ...base(), reason, ...(fields ? { fields } : {}) });
    },
    [base],
  );

  const complete = useCallback(() => {
    completed.current = true;
  }, []);

  useEffect(() => {
    function onHidden() {
      if (
        document.visibilityState === "hidden" &&
        started.current &&
        !completed.current
      ) {
        completed.current = true; // n'émettre l'abandon qu'une fois
        track("form_abandon", base());
      }
    }
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [base]);

  return { start, submit, error, complete };
}
