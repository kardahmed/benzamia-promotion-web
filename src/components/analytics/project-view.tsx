"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { projectItem } from "@/lib/tracking/config";

/**
 * Affichage d'une fiche programme :
 *  - `view_item` (schéma e-commerce GA4, avec `items[]`) ;
 *  - `view_project` conservé en alias pour les balises GTM déjà en place.
 */
export function ProjectView({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    const item = projectItem(slug, name);
    track("view_item", { items: [item], project: slug, project_name: name });
    track("view_project", { project: slug, project_name: name });
  }, [slug, name]);
  return null;
}
