"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Émet `view_project` à l'affichage d'une fiche programme. */
export function ProjectView({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    track("view_project", { project: slug, project_name: name });
  }, [slug, name]);
  return null;
}
