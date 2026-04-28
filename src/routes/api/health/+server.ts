import { json } from '@sveltejs/kit';

export function GET() {
  return json({
    ok: true,
    service: 'mrguy-sveltekit',
    timestamp: new Date().toISOString(),
  });
}
