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
