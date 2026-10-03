"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold text-primary">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-navy-700 transition-colors hover:text-accent",
                pathname === item.href && "text-accent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-muted"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Button asChild>
            <Link href="/enquiry">Enquire Now</Link>
          </Button>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-navy-800 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-3 text-base font-medium text-navy-700 hover:bg-muted",
                  pathname === item.href && "bg-orange-50 text-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              className="rounded-lg px-3 py-3 text-base font-medium text-navy-700 hover:bg-muted"
            >
              Search
            </Link>
            <Button asChild className="mt-2">
              <Link href="/enquiry">Enquire Now</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
