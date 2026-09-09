"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { homeContent } from "@/content/home";
import { PrimaryButton, SecondaryButton, resolveHref } from "./cta";

/**
 * Hero — le chantier de la Résidence La Cité avance au défilement.
 *
 * Trois régimes, choisis par les capacités réelles du visiteur :
 *  - `scrub`  (écran large, animations acceptées) : la position de défilement
 *    pilote `currentTime`. La vidéo est encodée en TOUTES images-clés, sans
 *    quoi chaque recherche devrait décoder depuis l'image-clé précédente et
 *    le rendu saccaderait.
 *  - `play`   (mobile) : Safari iOS gère mal la recherche image par image, et
 *    piéger un téléphone dans 3 écrans de défilement serait hostile. La vidéo
 *    (légère : 561 ko) se joue une fois puis se fige sur le bâtiment livré.
 *  - `static` (`prefers-reduced-motion`) : image du bâtiment livré, rien d'autre.
 *
 * Le rendu serveur affiche l'image fixe ; la vidéo n'est montée qu'ensuite,
 * donc aucun octet de vidéo n'est téléchargé dans le régime `static`.
 */

type Mode = "static" | "play" | "scrub";

const VIDEO_SCRUB = "/hero/chantier-la-cite.mp4";
const VIDEO_PLAY = "/hero/chantier-la-cite-mobile.mp4";
const IMG_START = "/hero/chantier-la-cite-debut.jpg";
const IMG_FINAL = "/hero/chantier-la-cite-final.jpg";

/** Lissage exponentiel : le défilement d'une molette est saccadé, pas la vidéo. */
const SMOOTHING = 0.12;
/** Sous ce delta, inutile de redemander une image au décodeur. */
const SEEK_EPSILON = 0.008;

export function Hero() {
  const { eyebrow, title, description, actions, timelapse } = homeContent.hero;
  const { stages } = timelapse;

  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mode, setMode] = useState<Mode | null>(null);
  const [failed, setFailed] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  // Régime choisi après montage — le premier rendu reste identique côté serveur
  // et côté client (image fixe), donc pas d'écart d'hydratation.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px)");
    const decide = () =>
      setMode(reduce.matches ? "static" : wide.matches ? "scrub" : "play");

    decide();
    reduce.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      reduce.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  // Régime `play` : on démarre à l'entrée dans le viewport, une seule fois.
  useEffect(() => {
    if (mode !== "play") return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        void video.play().catch(() => {
          /* Lecture refusée (économie de données) : le poster suffit. */
        });
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [mode]);

  // Régime `scrub` : le défilement pilote la vidéo.
  useEffect(() => {
    if (mode !== "scrub") return;
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!runway || !stage || !video) return;

    let frame = 0;
    let smoothed = 0;
    let lastStage = -1;

    /** Part de la piste déjà parcourue, bornée à [0, 1]. */
    const scrollProgress = () => {
      const travel = runway.offsetHeight - window.innerHeight;
      if (travel <= 0) return 0;
      const scrolled = -runway.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, scrolled / travel));
    };

    const tick = () => {
      const target = scrollProgress();
      smoothed += (target - smoothed) * SMOOTHING;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;

      stage.style.setProperty("--hero-progress", smoothed.toFixed(4));

      const duration = video.duration;
      if (duration > 0 && video.readyState >= 2 && !video.seeking) {
        // On s'arrête juste avant la fin : demander la toute dernière image
        // renvoie parfois un écran noir selon les navigateurs.
        const time = smoothed * (duration - 0.05);
        if (Math.abs(video.currentTime - time) > SEEK_EPSILON) {
          video.currentTime = time;
        }
      }

      let next = 0;
      for (let i = 0; i < stages.length; i += 1) {
        if (smoothed >= stages[i].at) next = i;
      }
      if (next !== lastStage) {
        lastStage = next;
        setStageIndex(next); // au plus 5 rendus sur toute la descente
      }

      frame = requestAnimationFrame(tick);
    };

    video.pause();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, stages]);

  const showVideo = mode === "scrub" || mode === "play";
  const scrubbing = mode === "scrub" && !failed;

  return (
    <section
      ref={runwayRef}
      className="hero-runway bg-ink"
      data-video={failed ? "failed" : undefined}
      aria-label="Résidence La Cité, du terrassement à la livraison"
    >
      <div ref={stageRef} className="hero-stage">
        {/* Image de base : présente au premier rendu, sans JS, et sous la vidéo
            le temps qu'elle se charge. `static` affiche le bâtiment livré. */}
        <Image
          src={mode === "static" ? IMG_FINAL : IMG_START}
          alt={timelapse.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {showVideo && (
          <video
            ref={videoRef}
            key={mode}
            src={mode === "scrub" ? VIDEO_SCRUB : VIDEO_PLAY}
            poster={IMG_START}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Voile de lisibilité. Mobile : vertical, le texte occupe la largeur.
            Desktop : oblique, la colonne de texte est protégée à gauche et le
            bâtiment respire à droite. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.78)_38%,rgba(10,10,10,0.42)_70%,rgba(10,10,10,0.28)_100%)] md:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(102deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.88)_26%,rgba(10,10,10,0.55)_52%,rgba(10,10,10,0.12)_76%,rgba(10,10,10,0.05)_100%)] md:block"
        />
        {/* Pied sombre : franchit proprement la bordure avec la section blanche
            suivante et assoit la barre d'étapes. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(10,10,10,0.85),transparent)]"
        />

        <div className="relative flex h-full flex-col">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-28 pb-16 sm:px-6 lg:px-8">
            <p className="eyebrow text-white/75">{eyebrow}</p>
            <h1 className="mt-5 max-w-2xl text-5xl leading-[1.03] text-white sm:text-6xl lg:text-7xl">
              {title[0]}
              {/* `block` + `text-balance` sur la 2ᵉ ligne seule : sinon, sur
                  mobile, l'équilibrage porte sur tout le titre et laisse
                  « Chlef » orphelin sur une 3ᵉ ligne. */}
              <span className="block text-balance font-serif font-normal italic tracking-[-0.01em] text-white/90">
                {title[1]}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton href={resolveHref(actions[0])}>
                {actions[0]}
              </PrimaryButton>
              <SecondaryButton
                href={resolveHref(actions[1])}
                className="border-white/40 !text-white hover:border-white"
              >
                {actions[1]}
              </SecondaryButton>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 pb-7 sm:px-6 lg:px-8">
            {/* La barre n'a de sens que si le défilement pilote réellement la
                vidéo ; ailleurs elle promettrait une interaction inexistante. */}
            {scrubbing && (
              <div className="hidden md:block" aria-hidden>
                <div className="h-px w-full bg-white/25">
                  <div className="hero-rail-fill h-px w-full bg-brand-bright" />
                </div>
                <ol className="mt-3 flex justify-between">
                  {stages.map((stage, index) => (
                    <li
                      key={stage.label}
                      className={`text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                        index === stageIndex
                          ? "text-white"
                          : index < stageIndex
                            ? "text-white/65"
                            : "text-white/45"
                      }`}
                    >
                      {stage.label}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p
              className={`text-xs text-white/55 ${scrubbing ? "mt-5 md:text-right" : ""}`}
            >
              {timelapse.notice}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
