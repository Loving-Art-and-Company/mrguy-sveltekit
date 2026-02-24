import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    promoEnabled: env.PROMO_ENABLED !== 'false',
  };
};
