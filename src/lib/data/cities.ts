export interface ServiceCity {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  metaDescription: string;
  localPitch: string;
  nearbyAreas: string[];
}

export const SERVICE_CITIES: ServiceCity[] = [
  {
    slug: 'weston',
    name: 'Weston',
    latitude: 26.1004,
    longitude: -80.3998,
    metaDescription:
      'Mobile car detailing in Weston, FL. Mr. Guy Detail comes to your driveway for washes, interior details, and ceramic coating.',
    localPitch:
      'From family SUVs to daily drivers and Teslas, we handle the detail at your home so you can keep moving through your day in Weston.',
    nearbyAreas: ['Weston Isles', 'Savanna', 'The Ridges', 'Weston Hills']
  },
  {
    slug: 'pembroke-pines',
    name: 'Pembroke Pines',
    latitude: 26.0078,
    longitude: -80.2963,
    metaDescription:
      'Mobile car detailing in Pembroke Pines, FL. Book Mr. Guy Detail for driveway-friendly washes, interiors, and protection packages.',
    localPitch:
      'We help Pembroke Pines drivers skip the car wash line with mobile detailing that fits around school runs, workdays, and busy weekends.',
    nearbyAreas: ['Silver Lakes', 'Chapel Trail', 'Towngate', 'Grand Palms']
  },
  {
    slug: 'miramar',
    name: 'Miramar',
    latitude: 25.9873,
    longitude: -80.2323,
    metaDescription:
      'Mobile car detailing in Miramar, FL. Mr. Guy Detail comes to you for deep interior cleaning, premium washes, and ceramic coating.',
    localPitch:
      'Miramar drivers can book professional detailing at home, at the office, or wherever the car is parked when it needs attention.',
    nearbyAreas: ['Sunset Lakes', 'Silver Shores', 'Monarch Lakes', 'Vizcaya']
  },
  {
    slug: 'davie',
    name: 'Davie',
    latitude: 26.0765,
    longitude: -80.2521,
    metaDescription:
      'Mobile car detailing in Davie, FL. Professional detailing brought to your driveway, including washes, interior resets, and paint protection.',
    localPitch:
      'Whether your car is dealing with dust, mud, pet hair, or commuter wear, we bring a full detailing setup directly to Davie.',
    nearbyAreas: ['Ivanhoe', 'Shenandoah', 'Long Lake Ranches', 'Pine Island Ridge']
  },
  {
    slug: 'southwest-ranches',
    name: 'Southwest Ranches',
    latitude: 26.0584,
    longitude: -80.3373,
    metaDescription:
      'Mobile car detailing in Southwest Ranches, FL. Mr. Guy Detail delivers driveway-first washes, details, and ceramic coating services.',
    localPitch:
      'Southwest Ranches clients get concierge-style detailing without driving anywhere. We come prepared for larger driveways and multi-car households.',
    nearbyAreas: ['Rolling Oaks', 'Sunshine Ranches', 'Green Meadows', 'Landmark Ranch Estates']
  },
  {
    slug: 'cooper-city',
    name: 'Cooper City',
    latitude: 26.0573,
    longitude: -80.2717,
    metaDescription:
      'Mobile car detailing in Cooper City, FL. Book at-home detailing with Mr. Guy Detail for premium washes, interiors, and vehicle protection.',
    localPitch:
      'Cooper City families and commuters can keep the car clean without losing a Saturday morning to a waiting room or wash line.',
    nearbyAreas: ['Embassy Lakes', 'Monterra', 'Flamingo Gardens', 'Rock Creek']
  },
  {
    slug: 'plantation',
    name: 'Plantation',
    latitude: 26.1276,
    longitude: -80.2331,
    metaDescription:
      'Mobile car detailing in Plantation, FL. Mr. Guy Detail offers professional driveway detailing, interior cleaning, and ceramic coating.',
    localPitch:
      'Plantation clients use us when they want a cleaner car and a simpler day. We show up with the tools, water, and process ready to go.',
    nearbyAreas: ['Jacaranda', 'Central Park', 'Plantation Acres', 'Lagomar']
  }
];

export function getServiceCity(slug: string): ServiceCity | undefined {
  return SERVICE_CITIES.find((city) => city.slug === slug);
}
