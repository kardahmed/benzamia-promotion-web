import { Monogram } from "./brand";

/**
 * Emplacement média provisoire, en attendant les visuels définitifs
 * (photos, rendus et panoramas hébergés sur Supabase Storage — CDC §11).
 * Neutre, sans photo sous licence tierce dans le dépôt.
 */
export function MediaPlaceholder({
  label = "Visuel à venir",
  tone = "graphite",
  className = "",
}: {
  label?: string;
  tone?: "graphite" | "ink" | "brand";
  className?: string;
}) {
  const bg =
    tone === "ink"
      ? "from-ink to-[#2a2a2a]"
      : tone === "brand"
        ? "from-brand-deep to-ink"
        : "from-[#4a4a4a] to-[#1f1f1f]";
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${bg} ${className}`}
      aria-hidden
    >
      <Monogram tone="white" className="h-1/3 w-auto opacity-15" />
      <span className="absolute bottom-3 right-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
    </div>
  );
}
