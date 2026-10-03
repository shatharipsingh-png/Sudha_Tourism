import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, effectivePrice, discountPercent } from "@/lib/utils";

export type PackageCardData = {
  name: string;
  slug: string;
  image: string;
  durationDays: number;
  durationNights: number;
  price: number;
  discountPrice?: number | null;
  travelTypes: string[];
  rating: number;
  reviewCount: number;
  destination: { name: string };
};

export function PackageCard({ pkg }: { pkg: PackageCardData }) {
  const finalPrice = effectivePrice(pkg.price, pkg.discountPrice);
  const percentOff = discountPercent(pkg.price, pkg.discountPrice);

  return (
    <Link href={`/packages/${pkg.slug}`} className="group block">
      <Card className="card-hover overflow-hidden">
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={pkg.image}
            alt={pkg.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {percentOff > 0 && (
            <div className="absolute left-3 top-3">
              <Badge variant="danger">{percentOff}% OFF</Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-navy-800">
            <Clock className="h-3.5 w-3.5 text-accent" />
            {pkg.durationDays}D/{pkg.durationNights}N
          </div>
        </div>
        <div className="p-5">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {pkg.destination.name}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-primary line-clamp-1">
            {pkg.name}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {pkg.travelTypes.slice(0, 2).map((t) => (
              <Badge key={t} variant="navy">
                {t}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div>
              {percentOff > 0 && (
                <span className="mr-1.5 text-xs text-muted-foreground line-through">
                  {formatCurrency(pkg.price)}
                </span>
              )}
              <span className="font-display text-lg font-bold text-primary">
                {formatCurrency(finalPrice)}
              </span>
              <span className="text-xs text-muted-foreground"> /person</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-navy-800">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {pkg.rating.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground">({pkg.reviewCount})</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
