import { Star } from "lucide-react";

const SAMPLE_TESTIMONIALS = [
  {
    name: "Rohan S.",
    text: "Beautifully organised trip — every detail was taken care of, from pickup to the hotel stays. Would book again.",
  },
  {
    name: "Priya M.",
    text: "Our guide was fantastic and the itinerary struck a great balance between sightseeing and free time.",
  },
  {
    name: "Arjun & Kavya",
    text: "Great value for money. The team was responsive on WhatsApp throughout our honeymoon trip.",
  },
];

export function ReviewSection({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <div className="text-center">
          <p className="font-display text-4xl font-extrabold text-primary">{rating.toFixed(1)}</p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(rating) ? "fill-accent text-accent" : "text-border"}`}
              />
            ))}
          </div>
        </div>
        <div className="border-l border-border pl-4 text-sm text-muted-foreground">
          Based on {reviewCount} traveler reviews
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SAMPLE_TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-sm text-navy-700">&ldquo;{t.text}&rdquo;</p>
            <p className="mt-3 text-xs font-semibold text-navy-500">{t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
