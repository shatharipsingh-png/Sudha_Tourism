"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PriceFilter } from "@/components/shared/price-filter";
import { siteConfig } from "@/config/site";

export type PackageFiltersDestination = { name: string; slug: string };

const DURATIONS = [
  { label: "Any Duration", value: "" },
  { label: "1 – 3 Days", value: "1-3" },
  { label: "4 – 6 Days", value: "4-6" },
  { label: "7+ Days", value: "7+" },
];

export function PackageFilters({
  destinations,
}: {
  destinations: PackageFiltersDestination[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const destination = searchParams.get("destination") ?? "";
  const duration = searchParams.get("duration") ?? "";
  const price = searchParams.get("price") ?? "";
  const activeTypes = React.useMemo(
    () => searchParams.getAll("travelType"),
    [searchParams]
  );

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`/packages?${params.toString()}`);
  }

  function toggleTravelType(type: string) {
    updateParams((params) => {
      const current = params.getAll("travelType");
      params.delete("travelType");
      if (current.includes(type)) {
        current.filter((t) => t !== type).forEach((t) => params.append("travelType", t));
      } else {
        [...current, type].forEach((t) => params.append("travelType", t));
      }
    });
  }

  const hasFilters = destination || duration || price || activeTypes.length > 0;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-primary">Filters</h3>
        {hasFilters && (
          <button
            onClick={() => router.push("/packages")}
            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Destination</p>
        <Select
          value={destination}
          onChange={(e) =>
            updateParams((p) =>
              e.target.value ? p.set("destination", e.target.value) : p.delete("destination")
            )
          }
        >
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Travel Type</p>
        <div className="space-y-2">
          {siteConfig.travelTypes.map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
              <Checkbox
                checked={activeTypes.includes(type)}
                onCheckedChange={() => toggleTravelType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Duration</p>
        <Select
          value={duration}
          onChange={(e) =>
            updateParams((p) =>
              e.target.value ? p.set("duration", e.target.value) : p.delete("duration")
            )
          }
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Price Range</p>
        <PriceFilter
          value={price}
          onChange={(v) => updateParams((p) => (v ? p.set("price", v) : p.delete("price")))}
        />
      </div>
    </div>
  );
}
