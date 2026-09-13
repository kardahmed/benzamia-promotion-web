import { NextResponse } from 'next/server';
import { projects } from '@/content/projects';
import { getAvailability, AvailabilityUnavailable } from '@/lib/crm/availability';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const project = params.get('project') || '';
  if (!projects.some(p => p.slug === project)) return NextResponse.json({error: 'invalid_project'}, {status: 422});
  try {
    return NextResponse.json(await getAvailability(project, params.get('date') || ''), {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    return NextResponse.json({error: error instanceof AvailabilityUnavailable ? 'availability_unavailable' : 'invalid_date'}, {status: error instanceof AvailabilityUnavailable ? 503 : 422, headers: {'Cache-Control': 'no-store'}});
  }
}
