"use client";

import { cn } from "@/lib/utils";

export const PRICE_RANGES = [
  { label: "Any Price", value: "" },
  { label: "Under ₹10,000", value: "0-10000" },
  { label: "₹10,000 – ₹25,000", value: "10000-25000" },
  { label: "₹25,000 – ₹50,000", value: "25000-50000" },
  { label: "Above ₹50,000", value: "50000-999999999" },
];

export function PriceFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {PRICE_RANGES.map((range) => (
        <label
          key={range.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            value === range.value
              ? "border-accent bg-orange-50 font-semibold text-orange-700"
              : "border-border hover:border-accent/50"
          )}
        >
          <input
            type="radio"
            name="price-range"
            className="accent-orange-500"
            checked={value === range.value}
            onChange={() => onChange(range.value)}
          />
          {range.label}
        </label>
      ))}
    </div>
  );
}
