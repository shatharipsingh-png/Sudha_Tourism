import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import styles from "./Itinerary.module.css";
export default function Itinerary({ days = [] }) {
  const id = useId();
  const [open, setOpen] = useState(
    () => new Set(days.length ? [days[0].day] : []),
  );
  function toggle(day) {
    setOpen((current) => {
      const next = new Set(current);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }
  return (
    <div className={styles.list}>
      {days.map((day) => {
        const expanded = open.has(day.day);
        return (
          <article key={day.day} className={styles.day}>
            <h3>
              <button
                id={`${id}-button-${day.day}`}
                aria-expanded={expanded}
                aria-controls={`${id}-day-${day.day}`}
                onClick={() => toggle(day.day)}
              >
                <span className={styles.number}>
                  Day {String(day.day).padStart(2, "0")}
                </span>
                <span>{day.title}</span>
                {expanded ? (
                  <Minus size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
              </button>
            </h3>
            <div
              role="region"
              id={`${id}-day-${day.day}`}
              aria-labelledby={`${id}-button-${day.day}`}
              hidden={!expanded}
              className={styles.body}
            >
              <p>{day.description}</p>
              {day.activities?.length > 0 && (
                <ul>
                  {day.activities.map((activity, i) => (
                    <li key={i}>{activity}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
