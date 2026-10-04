export const PLACEHOLDER = "PLACEHOLDER";
export const isConfigured = (value) =>
  typeof value === "string" && value.trim() && value !== PLACEHOLDER;

export const site = {
  businessName: "Sudha Tourism",
  tagline: "Journeys through North India",
  phone: PLACEHOLDER,
  email: PLACEHOLDER,
  address: PLACEHOLDER,
  businessHours: PLACEHOLDER,
  whatsapp: PLACEHOLDER,
  socials: {
    instagram: PLACEHOLDER,
    facebook: PLACEHOLDER,
    youtube: PLACEHOLDER,
  },
  stats: {
    yearsInBusiness: PLACEHOLDER,
    travelerCount: PLACEHOLDER,
    destinationsCovered: PLACEHOLDER,
  },
  canonicalOrigin: PLACEHOLDER,
  description:
    "Explore North India with Sudha Tourism. Find inspiration for your next journey through its landscapes, cities and cultures.",
  heroImage:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2400&q=85",
  heroImageAlt: "Historic architecture in Rajasthan, North India",
  ctaImage:
    "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=2000&q=80",
  ctaImageAlt: "Mountain town in North India",
};
export const navigation = [
  ["Home", "/"],
  ["Destinations", "/destinations"],
  ["Packages", "/packages"],
  ["Experiences", "/experiences"],
  ["About", "/about"],
  ["Contact", "/contact"],
];
export const categories = [
  ["family", "Family"],
  ["adventure", "Adventure"],
  ["honeymoon", "Honeymoon"],
  ["spiritual", "Spiritual"],
  ["cultural", "Cultural"],
  ["wildlife", "Wildlife"],
  ["luxury", "Luxury"],
];
export const durations = [
  ["short", "1–4 days"],
  ["medium", "5–7 days"],
  ["long", "8+ days"],
];
export const popularDestinationLinks = [
  ["Rajasthan", "rajasthan"],
  ["Uttarakhand", "uttarakhand"],
  ["Himachal", "himachal-pradesh"],
  ["Delhi", "delhi"],
  ["Punjab", "punjab"],
];
