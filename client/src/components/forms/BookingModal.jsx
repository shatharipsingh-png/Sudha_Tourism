import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight } from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import { useLeadSubmission } from "../../hooks/useLeadSubmission";
import {
  bookingPayload,
  validateBooking,
  tomorrowUtc,
} from "../../utils/forms";
import LeadField from "./LeadField";
import Button from "../common/Button";
import styles from "./Forms.module.css";
const initial = {
  name: "",
  email: "",
  phone: "",
  travel_date: "",
  travelers: "1",
  room_preference: "",
  message: "",
  website: "",
};
export default function BookingModal({ open, onClose, travelPackage: pkg }) {
  const dialog = useDialog(open, onClose);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const lead = useLeadSubmission();
  useEffect(() => {
    lead.reset();
    setErrors({});
    if (open) setValues(initial);
  }, [open, lead.reset]);
  useEffect(() => {
    if (lead.success) dialog.current?.querySelector("#booking-title")?.focus();
  }, [lead.success, dialog]);
  function update(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  async function submit(event) {
    event.preventDefault();
    const feedback = validateBooking(values, pkg.id);
    setErrors(feedback);
    if (Object.keys(feedback).length) {
      dialog.current
        .querySelector(`[name="${Object.keys(feedback)[0]}"]`)
        ?.focus();
      return;
    }
    await lead.submit(bookingPayload(values, pkg.id));
  }
  const field = (name, label, props = {}) => (
    <LeadField
      prefix="booking"
      key={name}
      name={name}
      label={label}
      value={values[name]}
      onChange={update}
      error={errors[name] || lead.errors[name]}
      {...props}
    />
  );
  return (
    <dialog
      ref={dialog}
      aria-labelledby="booking-title"
      className={styles.dialog}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <button
        onClick={onClose}
        className={styles.close}
        aria-label="Close booking request"
      >
        <X size={22} aria-hidden="true" />
      </button>
      {lead.success ? (
        <div className={styles.success} role="status">
          <Check size={40} aria-hidden="true" />
          <h2 id="booking-title" tabIndex={-1}>
            Your booking request has been received.
          </h2>
          <p>
            This is a request, not a confirmed booking. Availability, final
            price and travel arrangements still need to be agreed.
          </p>
          <Button onClick={onClose}>Continue exploring</Button>
        </div>
      ) : (
        <>
          <p className={styles.eyebrow}>Take the next step</p>
          <h2 id="booking-title">Booking Request</h2>
          <p className={styles.context}>{pkg.title}</p>
          {pkg.destination?.name && (
            <p className={styles.note}>
              {pkg.destination.name} · {pkg.duration_days} days
            </p>
          )}
          <p className={styles.intro}>
            Share your preferred travel date and requirements. No payment is
            collected here, and submission does not confirm availability or a
            booking.
          </p>
          <form onSubmit={submit}>
            <fieldset disabled={lead.loading} className={styles.fields}>
              {field("name", "Full name", {
                required: true,
                maxLength: 160,
                autoComplete: "name",
                "data-autofocus": true,
              })}
              {field("phone", "Phone number", {
                required: true,
                type: "tel",
                maxLength: 20,
                autoComplete: "tel",
              })}
              {field("email", "Email address", {
                required: true,
                type: "email",
                maxLength: 320,
                autoComplete: "email",
              })}
              {field("travel_date", "Preferred travel date", {
                required: true,
                type: "date",
                min: tomorrowUtc(),
              })}
              {field("travelers", "Travelers", {
                required: true,
                type: "number",
                min: 1,
                max: 50,
                step: 1,
                inputMode: "numeric",
              })}
              <div className={styles.field}>
                <label htmlFor="booking-room">Room preference (optional)</label>
                <select
                  id="booking-room"
                  name="room_preference"
                  value={values.room_preference}
                  onChange={update}
                  aria-invalid={Boolean(lead.errors["details.room_preference"])}
                >
                  <option value="">No preference</option>
                  {["single", "double", "triple", "family"].map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {field("message", "Requirements (optional)", {
                multiline: true,
                rows: 3,
                maxLength: 2000,
              })}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="booking-website">Website</label>
                <input
                  id="booking-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={update}
                />
              </div>
            </fieldset>
            {lead.error && (
              <p role="alert" className={styles.error}>
                {lead.error}
              </p>
            )}
            <Button type="submit" loading={lead.loading}>
              Send booking request <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <p className={styles.note}>
              Read the <Link to="/terms">terms</Link> and{" "}
              <Link to="/cancellation">cancellation information</Link> before
              requesting travel.
            </p>
          </form>
        </>
      )}
    </dialog>
  );
}
