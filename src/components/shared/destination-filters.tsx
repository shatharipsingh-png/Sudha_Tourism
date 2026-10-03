"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function DestinationFilters() {
  const searchParams = useSearchParams();
  const active = searchParams.get("region") ?? "All";

  const options = ["All", ...siteConfig.regions];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((option) => {
        const href = option === "All" ? "/destinations" : `/destinations?region=${encodeURIComponent(option)}`;
        const isActive = active === option;
        return (
          <Link
            key={option}
            href={href}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "border-accent bg-accent text-white"
                : "border-border bg-white text-navy-700 hover:border-accent hover:text-accent"
            )}
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
