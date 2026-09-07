import Script from "next/script";
import { GTM_ID } from "@/lib/analytics";

/**
 * Script inline exécuté pendant l'analyse du HTML, avant tout le reste :
 * dataLayer + refus par défaut (Consent Mode v2), puis application du choix
 * déjà présent dans le cookie `benzamia_consent`.
 */
const CONSENT_INIT = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
try{var m=document.cookie.match(/(?:^|; )benzamia_consent=([^;]*)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c&&c.v===1){gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.marketing?'granted':'denied',ad_user_data:c.marketing?'granted':'denied',ad_personalization:c.marketing?'granted':'denied'});}}}catch(e){}
`;

/** Google Tag Manager + Google Consent Mode v2 (CDC §13). */
export function TagManager() {
  if (!GTM_ID) return null;
  return (
    <>
      {/* Consent Mode doit s'exécuter avant GTM : beforeInteractive dans le
          root layout est le motif recommandé (la règle ESLint vise le Pages
          Router). */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script id="consent-init" strategy="beforeInteractive">
        {CONSENT_INIT}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    </>
  );
}

/** `<noscript>` GTM — à placer juste après l'ouverture de `<body>`. */
export function TagManagerNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
