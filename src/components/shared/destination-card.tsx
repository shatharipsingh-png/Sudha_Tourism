import Image from "next/image";
import Link from "next/link";
import { MapPin, Package as PackageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type DestinationCardData = {
  name: string;
  slug: string;
  shortDescription: string;
  image: string;
  region: string;
  packageCount?: number;
};

export function DestinationCard({ destination }: { destination: DestinationCardData }) {
  return (
    <Link href={`/destinations/${destination.slug}`} className="group block">
      <Card className="card-hover overflow-hidden">
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge variant="default">
              <MapPin className="h-3 w-3" /> {destination.region}
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-primary">{destination.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {destination.shortDescription}
          </p>
          {typeof destination.packageCount === "number" && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-navy-600">
              <PackageIcon className="h-3.5 w-3.5 text-accent" />
              {destination.packageCount} {destination.packageCount === 1 ? "package" : "packages"} available
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
