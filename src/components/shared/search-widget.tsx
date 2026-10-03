"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Compass, Clock } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export type SearchWidgetDestination = { name: string; slug: string };

export function SearchWidget({
  destinations,
}: {
  destinations: SearchWidgetDestination[];
}) {
  const router = useRouter();
  const [destination, setDestination] = React.useState("");
  const [travelType, setTravelType] = React.useState("");
  const [duration, setDuration] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (travelType) params.set("travelType", travelType);
    if (duration) params.set("duration", duration);
    router.push(`/packages${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-floating sm:grid-cols-2 lg:grid-cols-[1.4fr_1.4fr_1fr_auto] lg:items-end lg:gap-3"
    >
      <Field label="Where to?" icon={<MapPin className="h-4 w-4" />}>
        <Select value={destination} onChange={(e) => setDestination(e.target.value)}>
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Travel Type" icon={<Compass className="h-4 w-4" />}>
        <Select value={travelType} onChange={(e) => setTravelType(e.target.value)}>
          <option value="">Any type</option>
          {siteConfig.travelTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Duration" icon={<Clock className="h-4 w-4" />}>
        <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="">Any duration</option>
          <option value="1-3">1–3 Days</option>
          <option value="4-6">4–6 Days</option>
          <option value="7+">7+ Days</option>
        </Select>
      </Field>

      <Button type="submit" size="lg" className="w-full lg:w-auto">
        <Search className="h-4 w-4" /> Explore Packages
      </Button>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-navy-700">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}
