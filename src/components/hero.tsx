"use client";

import { useEffect, useRef, useState } from "react";
import { homeContent } from "@/content/home";
import { PrimaryButton, SecondaryButton, resolveHref } from "./cta";

/**
 * Hero — le chantier de la Résidence La Cité avance au défilement.
 *
 * Le défilement pilote `currentTime`, sur téléphone comme sur ordinateur. La
 * vidéo est encodée en TOUTES images-clés, sans quoi chaque recherche devrait
 * décoder depuis l'image-clé précédente et le rendu saccaderait.
 *
 * Deux montages selon la largeur : en portrait, un cadrage 16/9 ne laisserait
 * voir que 26 % de sa largeur, agrandie 3,4 fois. Le téléphone reçoit donc un
 * recadrage portrait centré sur le bâtiment — mieux cadré, et trois fois plus
 * léger (1,5 Mo contre 4,2).
 *
 * `prefers-reduced-motion` : image du bâtiment livré, aucune vidéo montée donc
 * aucun octet téléchargé. Le rendu serveur affiche cette image, la vidéo n'est
 * montée qu'ensuite.
 */

type Mode = "static" | "scrub";

const VIDEO_WIDE = "/hero/chantier-la-cite.mp4";
const VIDEO_NARROW = "/hero/chantier-la-cite-mobile.mp4";
const IMG_WIDE_START = "/hero/chantier-la-cite-debut.jpg";
const IMG_WIDE_FINAL = "/hero/chantier-la-cite-final.jpg";
const IMG_NARROW_START = "/hero/chantier-la-cite-mobile-debut.jpg";
const IMG_NARROW_FINAL = "/hero/chantier-la-cite-mobile-final.jpg";

/** Lissage exponentiel : le défilement est saccadé, pas la vidéo. */
const SMOOTHING = 0.12;
/** Sous ce delta, inutile de redemander une image au décodeur. */
const SEEK_EPSILON = 0.008;
/** Délai avant de conclure que la recherche image par image ne répond pas. */
const SEEK_WATCHDOG_MS = 2500;

export function Hero() {
  const { eyebrow, title, description, descriptionShort, actions, timelapse } =
    homeContent.hero;
  const { stages } = timelapse;

  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mode, setMode] = useState<Mode | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  // Régime choisi après montage — le premier rendu reste identique côté serveur
  // et côté client (image fixe), donc pas d'écart d'hydratation.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px)");
    const decide = () => {
      setNarrow(!wide.matches);
      setMode(reduce.matches ? "static" : "scrub");
    };

    decide();
    reduce.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      reduce.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  // Repli : la recherche image par image ne répond pas (ou la vidéo a échoué).
  // On joue la séquence une fois, la piste de défilement étant repliée.
  useEffect(() => {
    if (!degraded) return;
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
  }, [degraded]);

  // Le défilement pilote la vidéo.
  useEffect(() => {
    if (mode !== "scrub" || degraded) return;
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!runway || !stage || !video) return;

    // Sans course, rien à piloter : la vidéo resterait figée sur sa première
    // image, un terrain vague. Mieux vaut alors la jouer simplement.
    if (runway.offsetHeight - stage.offsetHeight <= 0) {
      setDegraded(true);
      return;
    }

    /*
     * Amorçage. Plusieurs navigateurs mobiles — Safari iOS en tête — ne
     * décodent aucune image tant que la lecture n'a pas démarré au moins une
     * fois : la vidéo resterait figée sur sa première image pendant tout le
     * défilement. On lance donc une lecture aussitôt suivie d'une pause ; la
     * vidéo est muette et `playsInline`, donc la lecture automatique est
     * autorisée.
     */
    const primed = video.play();
    if (primed) primed.then(() => video.pause()).catch(() => video.pause());
    else video.pause();

    /*
     * Chien de garde. Si malgré l'amorçage la lecture ne se déplace jamais
     * alors que le visiteur a bel et bien défilé, on replie tout : mieux vaut
     * une vidéo qui se joue simplement qu'un hero figé sur deux écrans de vide.
     */
    let seekWorked = false;
    let hasScrolled = false;
    const onSeeked = () => {
      seekWorked = true;
    };
    video.addEventListener("seeked", onSeeked);
    const watchdog = window.setTimeout(() => {
      if (!seekWorked && hasScrolled) setDegraded(true);
    }, SEEK_WATCHDOG_MS);

    let frame = 0;
    let smoothed = 0;
    let lastStage = -1;

    /** Part de la piste déjà parcourue, bornée à [0, 1]. */
    const scrollProgress = () => {
      const travel = runway.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return 0;
      const scrolled = -runway.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, scrolled / travel));
    };

    const tick = () => {
      const target = scrollProgress();
      if (target > 0.03) hasScrolled = true;
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

    // La boucle ne tourne que tant que le hero est à l'écran : inutile de
    // recalculer 60 fois par seconde quand le visiteur lit le bas de la page.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !frame) {
          frame = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(stage);

    return () => {
      observer.disconnect();
      video.removeEventListener("seeked", onSeeked);
      window.clearTimeout(watchdog);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode, degraded, stages]);

  const scrubbing = mode === "scrub" && !degraded;
  const poster = narrow ? IMG_NARROW_START : IMG_WIDE_START;

  return (
    <section
      ref={runwayRef}
      className="hero-runway bg-ink"
      data-video={degraded ? "failed" : undefined}
      aria-label="Résidence La Cité, du terrassement à la livraison"
    >
      <div ref={stageRef} className="hero-stage">
        {/*
          Image de base : présente au premier rendu, sans JS, et sous la vidéo
          le temps qu'elle se charge. `static` affiche le bâtiment livré.

          Balise `img` volontaire plutôt que `next/image` : l'optimiseur servait
          une URL `/_next/image` tandis que l'attribut `poster` de la vidéo
          chargeait le JPEG brut — la même image était donc téléchargée DEUX
          fois à chaque visite. Ici les deux partagent la même URL, donc le même
          cache. Les fichiers sont déjà calibrés pour cet usage précis (138 ko
          en paysage, 58 ko en portrait) : l'optimiseur n'avait plus grand-chose
          à gagner, et il réclamait en prime une variante 3840 px d'une source
          qui n'en fait que 1280.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            mode === "static"
              ? narrow
                ? IMG_NARROW_FINAL
                : IMG_WIDE_FINAL
              : poster
          }
          alt={timelapse.alt}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {mode !== null && mode !== "static" && (
          <video
            ref={videoRef}
            key={narrow ? "narrow" : "wide"}
            src={narrow ? VIDEO_NARROW : VIDEO_WIDE}
            poster={poster}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            onError={() => setDegraded(true)}
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
          {/* Marges resserrées sur téléphone : à pleine valeur, la hauteur
              minimale de ce bloc dépasse l'écran et pousse la barre d'étapes
              hors du cadre collant, qui la rogne. */}
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-20 pb-3 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8">
            <p className="eyebrow text-white/75">{eyebrow}</p>
            <h1 className="mt-4 max-w-2xl text-[2.75rem] leading-[1.03] text-white sm:mt-5 sm:text-6xl lg:text-7xl">
              {title[0]}
              {/* `block` + `text-balance` sur la 2ᵉ ligne seule : sinon, sur
                  mobile, l'équilibrage porte sur tout le titre et laisse
                  « Chlef » orphelin sur une 3ᵉ ligne. */}
              <span className="block text-balance font-serif font-normal italic tracking-[-0.01em] text-white/90">
                {title[1]}
              </span>
            </h1>
            {/* Sous 640 px, la version courte : le texte complet fait sept
                lignes et pousserait la barre d'étapes hors de l'écran. */}
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85 sm:mt-6">
              <span className="sm:hidden">{descriptionShort}</span>
              <span className="hidden sm:inline">{description}</span>
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:mt-8">
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

            {/* Sans cette invitation, un visiteur qui lit le titre puis clique
                ne découvre jamais que le chantier avance au défilement. */}
            {scrubbing && (
              <p className="hero-scroll-cue mt-7 flex sm:mt-10 items-center gap-2.5 text-sm text-white/70">
                <svg
                  aria-hidden
                  viewBox="0 0 16 20"
                  className="h-5 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v13M3.5 11.5 8 16.5l4.5-5" />
                </svg>
                Faites défiler : le chantier avance
              </p>
            )}
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 sm:pb-7 lg:px-8">
            {/* La barre n'a de sens que si le défilement pilote réellement la
                vidéo ; ailleurs elle promettrait une interaction inexistante. */}
            {scrubbing && (
              <div aria-hidden>
                <div className="h-px w-full bg-white/25">
                  <div className="hero-rail-fill h-px w-full bg-brand-bright" />
                </div>
                {/* Sur téléphone, cinq libellés côte à côte seraient illisibles :
                    on n'affiche que l'étape en cours. */}
                <p className="mt-2 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-white sm:mt-3 md:hidden">
                  {stages[stageIndex].label}
                </p>
                <ol className="mt-3 hidden justify-between md:flex">
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
              className={`text-xs text-white/55 ${scrubbing ? "mt-2 sm:mt-5 md:text-right" : ""}`}
            >
              {timelapse.notice}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
