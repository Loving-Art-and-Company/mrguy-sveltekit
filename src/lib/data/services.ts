/**
 * Mr. Guy Mobile Detail - Service Packages, Subscriptions & Add-Ons
 * Source of truth for pricing and service data
 * Updated from Mr.Guy menu .xlsx
 */

export interface ServicePackage {
  id: string;
  name: string;
  priceLow: number;
  priceHigh: number;
  avgPrice: number;
  description: string;
  includes: string[];
  badge?: string;
  category: 'one-time' | 'subscription';
}

export interface SubscriptionTier {
  id: string;
  name: string;
  priceLow: number;
  priceHigh: number;
  frequency: 'monthly';
  description: string;
  includes: string[];
  badge?: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number | string; // string for variable pricing like "$350 for gold"
  notes?: string;
  availableFor: ('silver' | 'gold' | 'platinum' | 'all')[];
}

export interface ExtraFee {
  id: string;
  name: string;
  price: number;
}

export const BUSINESS_INFO = {
  name: "Mr. Guy Mobile Detail",
  tagline: "We Know a Guy.",
  subTagline: "Premium detailing, right in your driveway.",
  website: "mrguydetail.com",
  location: "West Broward, South Florida",
  serviceArea: ["West Broward", "Broward County", "South Florida"],
  hours: "Mon-Sat 8AM-6PM (By appointment - We come to you!)",
  priceRange: "$30 - $750",
  promo: {
    name: "Fresh Start",
    discount: 25,
    description: "25% off your first booking"
  },
  valueProps: [
    "We come to you",
    "You don't like it, we fix it",
    "Won't mess up your driveway",
    "Insured (just in case)"
  ]
} as const;

// ============================================
// SUBSCRIPTION TIERS (Monthly Packages)
// ============================================
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "silver",
    name: "Silver",
    priceLow: 40,
    priceHigh: 85,
    frequency: "monthly",
    description: "Keep your ride looking good without thinking about it.",
    includes: [
      "Interior & exterior wash",
      "Tire shine",
      "14-day wax",
      "Windows",
      "Trim/chrome care"
    ],
  },
  {
    id: "gold",
    name: "Gold",
    priceLow: 100,
    priceHigh: 180,
    frequency: "monthly",
    description: "The works. Your car stays fresh while you stay busy.",
    includes: [
      "All Silver options",
      "Clay bar treatment",
      "Leather shampoo & wash",
      "Window ceramic coat",
      "Air freshener of choice"
    ],
    badge: "POPULAR",
  },
  {
    id: "platinum",
    name: "Platinum",
    priceLow: 250,
    priceHigh: 400,
    frequency: "monthly",
    description: "Showroom shine every month. For people who actually use their car.",
    includes: [
      "All Gold options",
      "2-step paint correction",
      "Window ceramic coat",
      "Exclusive discounts on special services"
    ],
    badge: "BEST VALUE",
  },
];

// ============================================
// ONE-TIME SERVICES
// ============================================
export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "exterior_wash",
    name: "Exterior Wash",
    priceLow: 30,
    priceHigh: 50,
    avgPrice: 40,
    description: "Quick wash. We come to you, you stay doing whatever.",
    includes: ["Foam cannon bath", "Spot-free rinse", "Tire shine", "Window cleaning"],
    category: 'one-time',
  },
  {
    id: "interior_wash",
    name: "Interior Wash",
    priceLow: 30,
    priceHigh: 50,
    avgPrice: 40,
    description: "Get rid of the crumbs, coffee stains, and mystery smells.",
    includes: ["Full vacuum", "Dashboard wipe", "Door panels", "Console cleaning"],
    category: 'one-time',
  },
  {
    id: "full_wax",
    name: "Full Wax",
    priceLow: 150,
    priceHigh: 150,
    avgPrice: 150,
    description: "Makes your car look like you actually care about it.",
    includes: ["Hand wax application", "Buff and polish", "UV protection", "Water beading"],
    category: 'one-time',
  },
  {
    id: "clay_bar",
    name: "Clay Bar Treatment",
    priceLow: 75,
    priceHigh: 75,
    avgPrice: 75,
    description: "Smooths out all the gunk you can't see but definitely feel.",
    includes: ["Full clay bar treatment", "Surface decontamination", "Prep for wax/ceramic"],
    category: 'one-time',
  },
  {
    id: "paint_correction_clay",
    name: "Paint Correction + Clay Bar",
    priceLow: 175,
    priceHigh: 175,
    avgPrice: 175,
    description: "Fix the swirls and scratches from that automatic car wash.",
    includes: ["Clay bar treatment", "Paint correction", "Swirl removal", "Scratch reduction"],
    category: 'one-time',
  },
  {
    id: "two_step_correction",
    name: "2-Step Paint Correction",
    priceLow: 275,
    priceHigh: 275,
    avgPrice: 275,
    description: "The real deal. Removes years of wear and bad washes.",
    includes: ["Compound stage", "Polish stage", "Swirl elimination", "Deep scratch removal"],
    category: 'one-time',
    badge: "PRO",
  },
  {
    id: "window_ceramic",
    name: "Window Ceramic Coat",
    priceLow: 100,
    priceHigh: 100,
    avgPrice: 100,
    description: "Rain literally slides off. No more squinting through streaks.",
    includes: ["All windows treated", "Rain repellent", "Easy cleaning", "UV protection"],
    category: 'one-time',
  },
  {
    id: "tire_ceramic",
    name: "Tire Ceramic Coat",
    priceLow: 100,
    priceHigh: 100,
    avgPrice: 100,
    description: "Tires stay black and clean way longer than normal.",
    includes: ["All tires treated", "UV protection", "Long-lasting shine", "Dirt repellent"],
    category: 'one-time',
  },
  {
    id: "full_ceramic",
    name: "Full Body Ceramic Coat",
    priceLow: 400,
    priceHigh: 750,
    avgPrice: 575,
    description: "Years of protection. Worth it if you keep your car more than 2 years.",
    includes: ["Full paint prep", "Ceramic application", "Hydrophobic finish", "Multi-year protection"],
    category: 'one-time',
    badge: "ULTIMATE",
  },
];

// ============================================
// ADD-ONS (Available with subscriptions)
// ============================================
export const ADD_ONS: AddOn[] = [
  {
    id: "headlight_restoration",
    name: "Headlight Restoration",
    price: 60,
    availableFor: ['all'],
  },
  {
    id: "addon_wax",
    name: "Wax",
    price: 50,
    availableFor: ['silver'],
  },
  {
    id: "addon_paint_correction",
    name: "Paint Correction/Polish",
    price: 100,
    availableFor: ['silver'],
  },
  {
    id: "addon_tire_ceramic",
    name: "Tire Ceramic Coat",
    price: 75,
    availableFor: ['silver'],
  },
  {
    id: "addon_window_ceramic",
    name: "Window Ceramic Coat",
    price: 75,
    availableFor: ['silver', 'gold'],
  },
  {
    id: "addon_clay_bar",
    name: "Clay Bar",
    price: 100,
    availableFor: ['silver'],
  },
  {
    id: "addon_full_2step",
    name: "Full 2-Step Correction",
    price: 200,
    notes: "Requires clay bar",
    availableFor: ['gold'],
  },
  {
    id: "addon_ceramic_coat",
    name: "Ceramic Coat",
    price: "$350 (Gold) / $100 (Platinum)",
    notes: "Requires 2-step correction",
    availableFor: ['gold', 'platinum'],
  },
];

// ============================================
// EXTRA FEES
// ============================================
export const EXTRA_FEES: ExtraFee[] = [
  {
    id: "pet_hair",
    name: "Pet Hair Removal",
    price: 10,
  },
  {
    id: "vomit_feces",
    name: "Vomit / Feces Cleaning",
    price: 50,
  },
  {
    id: "blood_stains",
    name: "Blood Stain Removal",
    price: 25,
  },
];

// Legacy export for backward compatibility
export const MEMBERSHIP_TIERS = SUBSCRIPTION_TIERS.map(tier => ({
  id: tier.id + '_membership',
  name: tier.name,
  price: tier.priceLow,
  frequency: 'Monthly',
  description: tier.description,
  features: tier.includes,
  recommendedFor: tier.badge || '',
}));

/**
 * Calculate discounted price for Fresh Start promo
 */
export function getPromoPrice(price: number): number {
  return Math.round(price * (1 - BUSINESS_INFO.promo.discount / 100));
}

/**
 * Get add-ons available for a subscription tier
 */
export function getAddOnsForTier(tierId: string): AddOn[] {
  return ADD_ONS.filter(addon =>
    addon.availableFor.includes('all') ||
    addon.availableFor.includes(tierId as 'silver' | 'gold' | 'platinum')
  );
}
