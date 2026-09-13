import assert from 'node:assert/strict';
import test from 'node:test';
import {getAvailability, algerDayRange} from '../../src/lib/crm/availability.ts';
const now = Date.parse('2026-09-13T00:00:00Z');
process.env.IMMOPROX_API_BASE_URL='https://crm.example.test/site-integration';
process.env.IMMOPROX_API_TOKEN='test-only';
const reply = (slots=[],duration=45) => ({project_ref:'residence-la-cite',timezone:'Africa/Algiers',duration_minutes:duration,slot_step_minutes:duration,slots});
const slot={starts_at:'2026-09-18T08:00:00.000Z',ends_at:'2026-09-18T08:45:00.000Z'};
test('fermeture et réouverture viennent du CRM même un vendredi',async()=>{
  const closed=await getAvailability('residence-la-cite','2026-09-18',now,async()=>Response.json(reply()));
  assert.deepEqual(closed.slots,[]);
  const open=await getAvailability('residence-la-cite','2026-09-18',now,async(url,options)=>{
    assert.equal(url.searchParams.has('duration_minutes'),false);
    assert.equal(options.headers.authorization,'Bearer test-only');
    assert.equal(options.cache,'no-store');
    return Response.json({...reply([{...slot,agent_id:'must-not-leak'}]),private_field:'hidden'});
  });
  assert.equal(open.duration_minutes,45);
  assert.deepEqual(open.slots,[slot]);
  assert.equal(open.private_field,undefined);
});
test('indisponibilité ou réponse incohérente : aucun calendrier inventé',async()=>{
  for(const response of [new Response('',{status:503}),Response.json({...reply([slot]),project_ref:'other'}),Response.json(reply([{...slot,ends_at:'2026-09-18T08:30:00.000Z'}]))]){
    await assert.rejects(getAvailability('residence-la-cite','2026-09-18',now,async()=>response),/crm_unavailable/);
  }
});
test('journée algérienne et dates invalides',()=>{
  assert.equal(new Date(algerDayRange('2026-09-18').from).toISOString(),'2026-09-17T23:00:00.000Z');
  assert.throws(()=>algerDayRange('2026-02-30'));
});

test('visites de 30 minutes proposées toutes les 15 minutes', async () => {
  const slots = [
    { starts_at: '2026-09-18T08:00:00.000Z', ends_at: '2026-09-18T08:30:00.000Z' },
    { starts_at: '2026-09-18T08:15:00.000Z', ends_at: '2026-09-18T08:45:00.000Z' },
  ];
  const result = await getAvailability('residence-la-cite', '2026-09-18', now,
    async () => Response.json({ ...reply(slots, 30), slot_step_minutes: 15 }));
  assert.equal(result.duration_minutes, 30);
  assert.equal(result.slot_step_minutes, 15);
  assert.deepEqual(result.slots, slots);
});

test('cadence absente, non entière, non positive ou supérieure à la durée refusée', async () => {
  for (const step of [undefined, null, '15', 0, -15, 1.5, 46]) {
    await assert.rejects(getAvailability('residence-la-cite', '2026-09-18', now,
      async () => Response.json({ ...reply([slot]), slot_step_minutes: step })), /crm_unavailable/);
  }
});

test('un créneau sous 24 h ne masque pas les heures valides du lendemain', async () => {
  // 10:00 Alger aujourd’hui ; demain 09:00 est trop proche, 14:00 et 14:30 restent valides.
  const current = Date.parse('2026-09-17T09:00:00.000Z');
  const slots = [
    { starts_at: '2026-09-18T08:00:00.000Z', ends_at: '2026-09-18T08:30:00.000Z' },
    { starts_at: '2026-09-18T13:00:00.000Z', ends_at: '2026-09-18T13:30:00.000Z' },
    { starts_at: '2026-09-18T13:30:00.000Z', ends_at: '2026-09-18T14:00:00.000Z' },
  ];
  const result = await getAvailability('residence-la-cite', '2026-09-18', current,
    async () => Response.json(reply(slots, 30)));
  assert.deepEqual(result.slots, slots.slice(1));
});

test('seuil 24 h inclus et journée trop proche vide sans erreur', async () => {
  const current = Date.parse('2026-09-17T09:00:00.000Z');
  const early = { starts_at: '2026-09-18T08:59:59.000Z', ends_at: '2026-09-18T09:29:59.000Z' };
  const boundary = { starts_at: '2026-09-18T09:00:00.000Z', ends_at: '2026-09-18T09:30:00.000Z' };
  for (const [slots, expected] of [[[early], []], [[early, boundary], [boundary]]]) {
    const result = await getAvailability('residence-la-cite', '2026-09-18', current,
      async () => Response.json(reply(slots, 30)));
    assert.deepEqual(result.slots, expected);
  }
});
