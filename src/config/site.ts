/**
 * Single source of truth for brand identity & navigation.
 * Swap these values (and the tokens in globals.css) to re-skin the entire
 * platform without touching feature code.
 */
export const siteConfig = {
  name: "Sudha Tourism",
  shortName: "Sudha",
  tagline: "Explore the Beauty, Culture & Adventure of the Himalayas and Beyond",
  heroTitle: "Discover North India",
  description:
    "Curated North India travel packages across Rajasthan, Uttarakhand, Himachal Pradesh, Delhi & Punjab — handpicked destinations, honest pricing, 24/7 support.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sudhatourism.com",
  ogImage: "/og-image.jpg",

  contact: {
    email: "info@sudhatourism.com",
    phone: "+91-98765-43210",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "911234567890",
    address: "Connaught Place, New Delhi, India 110001",
    hours: "Mon – Sun: 9:00 AM – 9:00 PM IST",
  },

  socials: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    twitter: "https://twitter.com/",
  },

  nav: [
    { label: "Destinations", href: "/destinations" },
    { label: "Packages", href: "/packages" },
    { label: "Experiences", href: "/experiences" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  footerLinks: {
    company: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
    support: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cancellation Policy", href: "/cancellation" },
      { label: "Enquire Now", href: "/enquiry" },
    ],
  },

  regions: [
    "Rajasthan",
    "Uttarakhand",
    "Himachal Pradesh",
    "Delhi",
    "Punjab",
  ] as const,

  travelTypes: [
    "Family",
    "Adventure",
    "Honeymoon",
    "Spiritual",
    "Wildlife",
    "Cultural",
    "Luxury",
  ] as const,

  experienceCategories: [
    "Adventure",
    "Spiritual",
    "Wildlife",
    "Culture",
    "Food",
    "Photography",
  ] as const,

  stats: [
    { label: "Years of Experience", value: "5+" },
    { label: "Happy Travelers", value: "10K+" },
    { label: "Destinations Covered", value: "50+" },
    { label: "Curated Packages", value: "100+" },
  ],

  currency: "INR",
  locale: "en-IN",
} as const;

export type SiteConfig = typeof siteConfig;
