import { ImageResponse } from "next/og";

export const alt = "BENZAMIA Promotion — Appartements neufs à Chlef";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONOGRAM_D =
  "M250 6L251 1031L81 1031L81 475L104 459L108 458L109 461L108 1002L152 1003L153 995L152 401L34 481L34 1031L6 1031L6 466L152 366L153 177L203 210L203 244L180 230L180 1002L223 1003L224 62L222 61L116 136L116 365L90 383L88 383L88 121L226 22ZM272 257L329 295L329 1031L301 1031L301 309L272 291Z";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#A50000",
          color: "#ffffff",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="70" height="216" viewBox="0 0 336 1038">
            <path d={MONOGRAM_D} fill="#ffffff" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 4 }}>
              BENZAMIA
            </div>
            <div style={{ fontSize: 20, letterSpacing: 10, opacity: 0.85 }}>
              PROMOTION
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Appartements neufs à Chlef, en toute clarté.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 26, opacity: 0.9 }}>
            Promotion immobilière à Chlef depuis 2013
          </div>
        </div>
      </div>
    ),
    size,
  );
}
