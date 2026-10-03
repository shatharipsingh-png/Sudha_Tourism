import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export type ItineraryDayData = {
  id: string;
  day: number;
  title: string;
  description: string;
  activities: string[];
};

export function ItineraryAccordion({ days }: { days: ItineraryDayData[] }) {
  if (days.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Day-by-day itinerary will be shared upon enquiry.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue={`day-${days[0]?.day}`} className="space-y-3">
      {days
        .sort((a, b) => a.day - b.day)
        .map((day) => (
          <AccordionItem key={day.id} value={`day-${day.day}`}>
            <AccordionTrigger>
              <span className="flex items-center gap-3">
                <Badge variant="default">Day {day.day}</Badge>
                <span>{day.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">{day.description}</p>
              {day.activities.length > 0 && (
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {day.activities.map((activity, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {activity}
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
    </Accordion>
  );
}
