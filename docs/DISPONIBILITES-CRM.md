# Disponibilités du formulaire de visite

Le formulaire demande au serveur du site les créneaux de la résidence et de la date sélectionnées : `GET /api/booking/availability?project=residence-la-cite&date=2026-09-18`.

Le serveur appelle `GET /v1/availability` du CRM, avec `project_ref`, `from` et `until` en UTC. Il ne transmet pas de durée imposée. Les variables existantes `IMMOPROX_API_BASE_URL` et `IMMOPROX_API_TOKEN` suffisent ; le jeton reste côté serveur.

Le formulaire affiche les heures précises en heure d’Algérie et la durée retournée. Jours ouvrables, pause, durée, cadence et occupation viennent du CRM. Aucun calendrier de secours n’est généré. Une journée sans créneau invite à changer de date ; une indisponibilité technique propose de réessayer ou d’appeler.

À l’envoi, le serveur relit les disponibilités avant le stockage et l’appel de réservation. Un créneau absent est refusé en HTTP 409 ; un CRM indisponible en HTTP 503. La durée envoyée à la réservation provient de cette nouvelle lecture, jamais d’une valeur fournie par le navigateur. Cette vérification ne réserve pas le créneau : le CRM reste responsable du contrôle final et de la confirmation manuelle.

Les anciens choix « Matin / Après-midi » ne sont plus acceptés. Un onglet ouvert avant la mise à jour doit être rechargé.

## Vérification locale

Le 13 septembre 2026, avec API CRM simulée et aucun secret réel : le navigateur affiche 09:00–09:45 et 14:15–15:00 pour une durée CRM de 45 minutes ; une réponse vide retire les options et une réponse 503 affiche l’indisponibilité avec envoi désactivé. Les POST directs sur une journée fermée et sur une heure absente renvoient 409 ; une indisponibilité CRM renvoie 503 ; l’ancien libellé de demi-journée renvoie 422. Aucun de ces essais ne crée de demande en production.

La cadence est distincte de la durée : une cadence entière strictement positive, inférieure ou égale à la durée, est acceptée. Par exemple, des visites de 30 minutes peuvent être proposées toutes les 15 minutes ; leurs heures de fin restent celles du CRM.

Le site filtre individuellement les créneaux à moins de 24 heures : ils ne rendent pas les autres créneaux indisponibles. Un début exactement à +24 heures est accepté ; une journée dont tous les créneaux sont trop proches retourne une liste vide, sans erreur technique. Le CRM applique déjà ce délai dans `get_site_availability_v1` (migration 370), mais le site garde ce filtrage indépendant.
