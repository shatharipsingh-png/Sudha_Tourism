import Link from "next/link";
import { MapPin, Phone, Mail, MapPinned, Instagram, Facebook, Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { prisma } from "@/lib/prisma";

async function getPopularDestinations() {
  try {
    return await prisma.destination.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: { name: true, slug: true },
    });
  } catch {
    return [];
  }
}

export async function Footer() {
  const destinations = await getPopularDestinations();

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container-page grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold text-white">{siteConfig.name}</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
            {siteConfig.description}
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-white">Get travel inspiration</p>
            <NewsletterForm variant="dark" />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <SocialLink href={siteConfig.socials.instagram} label="Instagram">
              <Instagram className="h-4 w-4" />
            </SocialLink>
            <SocialLink href={siteConfig.socials.facebook} label="Facebook">
              <Facebook className="h-4 w-4" />
            </SocialLink>
            <SocialLink href={siteConfig.socials.youtube} label="YouTube">
              <Youtube className="h-4 w-4" />
            </SocialLink>
          </div>
        </div>

        <FooterColumn
          title="Company"
          links={siteConfig.footerLinks.company}
        />

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
            Popular Destinations
          </h4>
          <ul className="space-y-3">
            {destinations.length === 0 && (
              <li className="text-sm text-navy-400">Coming soon</li>
            )}
            {destinations.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/destinations/${d.slug}`}
                  className="text-sm text-navy-300 transition-colors hover:text-accent"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Support</h4>
          <ul className="space-y-3">
            {siteConfig.footerLinks.support.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-navy-300 transition-colors hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3 text-sm text-navy-300">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-accent" /> {siteConfig.contact.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-accent" /> {siteConfig.contact.email}
            </p>
            <p className="flex items-start gap-2">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {siteConfig.contact.address}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-accent">Terms</Link>
            <Link href="/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/cancellation" className="hover:text-accent">Cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-navy-300 transition-colors hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-white transition-colors hover:bg-accent"
    >
      {children}
    </a>
  );
}
