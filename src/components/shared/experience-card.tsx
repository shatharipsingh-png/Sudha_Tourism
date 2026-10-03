import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ExperienceCardData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  image: string;
};

export function ExperienceCard({
  experience,
  active,
  onSelect,
}: {
  experience: ExperienceCardData;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="block w-full text-left">
      <Card
        className={`card-hover overflow-hidden ${active ? "ring-2 ring-accent" : ""}`}
      >
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={experience.image}
            alt={experience.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge variant="default">{experience.category}</Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-primary">{experience.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {experience.description}
          </p>
        </div>
      </Card>
    </button>
  );
}
