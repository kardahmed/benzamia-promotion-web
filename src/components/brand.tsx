import type { SVGProps } from "react";

/** Tracé officiel du monogramme — 3 tours imbriquées, ratio 336:1038. */
const MONOGRAM_D =
  "M250 6L251 1031L81 1031L81 475L104 459L108 458L109 461L108 1002L152 1003L153 995L152 401L34 481L34 1031L6 1031L6 466L152 366L153 177L203 210L203 244L180 230L180 1002L223 1003L224 62L222 61L116 136L116 365L90 383L88 383L88 121L226 22ZM272 257L329 295L329 1031L301 1031L301 309L272 291Z";

export function Monogram({
  tone = "brand",
  ...props
}: SVGProps<SVGSVGElement> & { tone?: "brand" | "white" | "black" }) {
  const fill =
    tone === "white" ? "#FFFFFF" : tone === "black" ? "#0A0A0A" : "#A50000";
  return (
    <svg viewBox="0 0 336 1038" role="presentation" {...props}>
      <path d={MONOGRAM_D} fill={fill} fillRule="evenodd" />
    </svg>
  );
}

/**
 * Logotype : monogramme + « BENZAMIA / PROMOTION » en Montserrat.
 * `tone="white"` sur fond noir ou rouge (charte : version tout blanc obligatoire).
 */
export function Logo({
  tone = "color",
  className = "",
}: {
  tone?: "color" | "white";
  className?: string;
}) {
  const white = tone === "white";
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Monogram
        tone={white ? "white" : "brand"}
        className="h-8 w-auto shrink-0"
      />
      <span className="font-logo leading-none">
        <span
          className={`block text-[15px] font-semibold tracking-[0.05em] ${
            white ? "text-white" : "text-ink"
          }`}
        >
          BENZAMIA
        </span>
        <span
          className={`block text-[8px] font-normal tracking-[0.25em] ${
            white ? "text-white/70" : "text-grey"
          }`}
        >
          PROMOTION
        </span>
      </span>
    </span>
  );
}
