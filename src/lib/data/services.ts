/**
 * Mr. Guy Mobile Detail - Service Packages & Memberships
 * Source of truth for pricing and service data
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
}

export interface MembershipTier {
  id: string;
  name: string;
  price: number;
  frequency: string;
  description: string;
  features: string[];
  recommendedFor: string;
  badge?: string;
}

/** Alias for PackageMenu compatibility */
export type SubscriptionTier = MembershipTier;

export const BUSINESS_INFO = {
  name: "Mr. Guy Mobile Detail",
  tagline: "We Know a Guy.",
  subTagline: "Premium detailing, right in your driveway.",
  website: "mrguydetail.com",
  location: "West Broward, South Florida",
  serviceArea: ["West Broward", "Broward County", "South Florida"],
  hours: "Mon-Sat 8AM-6PM (By appointment - We come to you!)",
  priceRange: "$45 - $2,000",
  promo: {
    name: "Fresh Start",
    discount: 25,
    description: "25% off your first booking"
  },
  valueProps: [
    "We come to you",
    "Satisfaction guaranteed",
    "Eco-friendly products",
    "Insured & professional"
  ]
} as const;

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "basic",
    name: 'The "Quick Refresh"',
    priceLow: 45,
    priceHigh: 75,
    avgPrice: 60,
    description: "Maintain a professional image without lifting a finger. Premium pH-neutral soaps preserve your paint's integrity.",
    includes: ["Foam Cannon Bath", "Spot-Free Rinse", "Tire Shine", "Interior Vacuum"],
  },
  {
    id: "silver",
    name: 'The "Family Hauler"',
    priceLow: 130,
    priceHigh: 220,
    avgPrice: 175,
    description: "Reclaim your sanity. We eliminate the evidence of road trips and school runs—deep cleaning carpets and sanitizing surfaces.",
    includes: ["Deep Interior Scrub", "Carpet Shampoo", "Leather Wipe Down", "Spray Wax Protection"],
  },
  {
    id: "ev_special",
    name: 'The "Electric"',
    priceLow: 150,
    priceHigh: 250,
    avgPrice: 200,
    description: "Specialized care for your high-tech investment. Sensor-safe techniques and EV-specific cleaners.",
    includes: ["Vegan Leather Care", "Frunk Cleaning", "Charge Port Detail", "Scratch-Free Wash"],
    badge: "TESLA FRIENDLY",
  },
  {
    id: "tesla_3y_special",
    name: 'The "Model 3/Y" Kit',
    priceLow: 150,
    priceHigh: 250,
    avgPrice: 200,
    description: "Expert maintenance targeting common Model 3/Y wear points—keeping white seats stain-free and glass roof crystal clear.",
    includes: ["Vegan Leather Conditioning", "Glass Roof Clarity", "Frunk & Sub-Trunk", "Screen Fingerprint Removal"],
    badge: "OWNER FAVORITE",
  },
  {
    id: "gold",
    name: 'The "Showroom"',
    priceLow: 220,
    priceHigh: 350,
    avgPrice: 285,
    description: "Turn heads at the office or the valet. Comprehensive detail that restores that 'just drove off the lot' feeling.",
    includes: ["Clay Bar Treatment", "Iron Decon", "6-Month Sealant", "Engine Bay Rinse"],
  },
  {
    id: "advanced",
    name: "Ceramic Coating",
    priceLow: 450,
    priceHigh: 2000,
    avgPrice: 1000,
    description: "Ultimate protection. A hardened shield that repels dirt and UV rays, making future washes effortless for years.",
    includes: ["Multi-Year Protection", "Paint Correction", "Hydrophobic Layer", "Carfax Report Update"],
  },
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "basic_membership",
    name: "The Regular",
    price: 69,
    frequency: "Monthly",
    description: "Set it and forget it. We come by once a month to keep it fresh.",
    features: ["1 Premium Wash / Month", "Vacuum & Wipe Down", "10% OFF other services", "Cancel anytime"],
    recommendedFor: "Leased Cars",
  },
  {
    id: "premium_membership",
    name: 'The "Always Clean"',
    price: 179,
    frequency: "Bi-Weekly",
    description: "We stop by every two weeks. Your car never looks dirty.",
    features: ["2 Visits Per Month", "1 Full Interior Deep Clean", "1 Maintenance Wash", "Priority Scheduling"],
    recommendedFor: "School Drop-off Line",
  },
  {
    id: "elite_membership",
    name: "The Enthusiast",
    price: 349,
    frequency: "Custom",
    description: "For the weekend toy or the baby of the garage.",
    features: ["Quarterly Detail + Ceramic Boost", "Engine Bay Included", "Annual Polish", "Direct line to the owners"],
    recommendedFor: "Sports Cars",
  },
];

// Alias for backward compatibility
export const SUBSCRIPTION_TIERS = MEMBERSHIP_TIERS;

// Add-ons and extra fees (empty for now, to be implemented)
export const ADD_ONS: any[] = [];
export const EXTRA_FEES: any[] = [];

export function getAddOnsForTier(tierId: string): any[] {
  return [];
}

/**
 * Calculate discounted price for Fresh Start promo
 */
export function getPromoPrice(price: number): number {
  return Math.round(price * (1 - BUSINESS_INFO.promo.discount / 100));
}
