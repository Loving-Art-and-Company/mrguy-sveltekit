import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getServiceCity, SERVICE_CITIES } from '$lib/data/cities';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const city = getServiceCity(params.slug);

  if (!city) {
    throw error(404, 'City page not found');
  }

  return {
    city,
    relatedCities: SERVICE_CITIES.filter((candidate) => candidate.slug !== city.slug).slice(0, 4),
    promoEnabled: env.PROMO_ENABLED !== 'false'
  };
};
