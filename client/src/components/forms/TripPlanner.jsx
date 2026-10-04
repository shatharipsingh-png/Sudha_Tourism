import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { categories, durations } from "../../config/site";
import Button from "../common/Button";
import styles from "./TripPlanner.module.css";
export default function TripPlanner({ destinations }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    destination: "",
    category: "",
    duration: "",
  });
  function update(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  function submit(event) {
    event.preventDefault();
    const query = new URLSearchParams(
      Object.entries(values).filter(([, value]) => value),
    );
    navigate("/packages" + (query.size ? "?" + query.toString() : ""));
  }
  return (
    <form
      className={styles.planner}
      onSubmit={submit}
      aria-label="Find your journey"
    >
      <div className={styles.field}>
        <label htmlFor="planner-destination">
          <MapPin size={14} aria-hidden="true" />
          Destination
        </label>
        <select
          id="planner-destination"
          name="destination"
          value={values.destination}
          onChange={update}
          disabled={destinations.loading || Boolean(destinations.error)}
        >
          <option value="">
            {destinations.loading
              ? "Loading destinations…"
              : destinations.error
                ? "Choose later"
                : "Anywhere in North India"}
          </option>
          {destinations.data?.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        {destinations.error && (
          <button
            type="button"
            className={styles.retry}
            onClick={destinations.retry}
          >
            Retry destinations
          </button>
        )}
      </div>
      <div className={styles.field}>
        <label htmlFor="planner-category">Travel style</label>
        <select
          id="planner-category"
          name="category"
          value={values.category}
          onChange={update}
        >
          <option value="">Your kind of journey</option>
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="planner-duration">Duration</label>
        <select
          id="planner-duration"
          name="duration"
          value={values.duration}
          onChange={update}
        >
          <option value="">Time to wander</option>
          {durations.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">
        Find a journey <ArrowRight size={17} aria-hidden="true" />
      </Button>
    </form>
  );
}
