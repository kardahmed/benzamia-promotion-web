/** Server use only. Never import this module into a client component. */
export type AvailableSlot = { starts_at: string; ends_at: string };
export type Availability = { timezone: string; duration_minutes: number; slot_step_minutes: number; slots: AvailableSlot[] };
export class AvailabilityUnavailable extends Error {}
export function algerDayRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid_date');
  const midnight = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== date) throw new Error('invalid_date');
  const from = midnight - 3600000;
  return { from, until: from + 86400000 };
}
export async function getAvailability(project: string, date: string, now = Date.now(), fetcher: typeof fetch = fetch): Promise<Availability> {
  const range = algerDayRange(date);
  const base = process.env.IMMOPROX_API_BASE_URL;
  const token = process.env.IMMOPROX_API_TOKEN;
  if (!base || !token) throw new AvailabilityUnavailable('crm_unavailable');
  const from = Math.max(range.from, now + 1000);
  if (range.until <= from || range.until > now + 90 * 86400000) throw new Error('invalid_date');
  try {
    const url = new URL(`${base.replace(/\/+$/, '')}/v1/availability`);
    url.search = new URLSearchParams({project_ref: project, from: new Date(from).toISOString(), until: new Date(range.until).toISOString()}).toString();
    const response = await fetcher(url, {headers: {authorization: `Bearer ${token}`}, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.project_ref !== project || data.timezone !== 'Africa/Algiers' || !Number.isInteger(data.duration_minutes) || data.duration_minutes < 15 || data.duration_minutes > 480 || data.slot_step_minutes !== data.duration_minutes || !Array.isArray(data.slots) || data.slots.length > 96) throw new Error();
    let previous = -Infinity;
    const slots = data.slots.map((s: AvailableSlot) => {
      const start = Date.parse(s.starts_at), end = Date.parse(s.ends_at);
      if (!Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString() !== s.starts_at || new Date(end).toISOString() !== s.ends_at || start < from || end > range.until || start < now + 86400000 || end - start !== data.duration_minutes * 60000 || start <= previous) throw new Error();
      previous = start;
      return {starts_at: s.starts_at, ends_at: s.ends_at};
    });
    return {timezone: data.timezone, duration_minutes: data.duration_minutes, slot_step_minutes: data.slot_step_minutes, slots};
  } catch { throw new AvailabilityUnavailable('crm_unavailable'); }
}
