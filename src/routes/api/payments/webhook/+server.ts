import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  throw error(
    410,
    'This backoffice-suite Stripe webhook endpoint is retired. Use web/mrguy-sveltekit as the production booking funnel.',
  );
};
