import { useEffect, useRef, useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { useEnquiry } from "../../context/EnquiryContext";
import { useDialog } from "../../hooks/useDialog";
import { useResource } from "../../hooks/useResource";
import { getDestinations, submitLead } from "../../api/api";
import { enquiryPayload, validateEnquiry } from "../../utils/forms";
import Button from "../common/Button";
import styles from "./Forms.module.css";
export default function EnquiryModal() {
  const { open, context, closeEnquiry } = useEnquiry();
  const ref = useDialog(open, closeEnquiry);
  const destinations = useResource(open ? getDestinations : null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({
    loading: false,
    success: false,
    error: "",
  });
  const pending = useRef(false);
  const request = useRef(null);
  useEffect(() => {
    if (state.success) ref.current?.querySelector("#enquiry-title")?.focus();
  }, [state.success, ref]);
  useEffect(() => {
    if (!open) {
      request.current?.abort();
      pending.current = false;
      return;
    }
    setValues({
      name: "",
      email: "",
      phone: "",
      destination_id: context.destinationId
        ? String(context.destinationId)
        : "",
      travel_date: "",
      travelers: "",
      message: context.message || "",
      travel_type: context.travelType || "",
      budget: "",
      website: "",
    });
    setErrors({});
    setState({ loading: false, success: false, error: "" });
  }, [open, context]);
  function update(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  async function submit(event) {
    event.preventDefault();
    const feedback = validateEnquiry(values);
    setErrors(feedback);
    if (Object.keys(feedback).length) {
      ref.current
        .querySelector(`[name="${Object.keys(feedback)[0]}"]`)
        ?.focus();
      return;
    }
    if (pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    setState({ loading: true, success: false, error: "" });
    try {
      await submitLead(enquiryPayload(values, context), controller.signal);
      if (!controller.signal.aborted)
        setState({ loading: false, success: true, error: "" });
    } catch (error) {
      if (!controller.signal.aborted) {
        setErrors(error.fields || {});
        setState({ loading: false, success: false, error: error.message });
      }
    } finally {
      if (request.current === controller) pending.current = false;
    }
  }
  function field(name, label, props = {}) {
    return (
      <div className={styles.field}>
        <label htmlFor={`enquiry-${name}`}>{label}</label>
        <input
          id={`enquiry-${name}`}
          name={name}
          value={values[name] || ""}
          onChange={update}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `error-${name}` : undefined}
          {...props}
        />
        {errors[name] && (
          <span id={`error-${name}`} className={styles.error}>
            {errors[name]}
          </span>
        )}
      </div>
    );
  }
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="enquiry-title"
      onClick={(event) => {
        if (event.target === ref.current) closeEnquiry();
      }}
    >
      <button
        className={styles.close}
        onClick={closeEnquiry}
        aria-label="Close enquiry"
      >
        <X size={22} aria-hidden="true" />
      </button>
      {state.success ? (
        <div className={styles.success} role="status">
          <Check size={40} aria-hidden="true" />
          <h2 id="enquiry-title" tabIndex={-1}>
            A new journey begins.
          </h2>
          <p>
            Your enquiry has been received. Thank you for sharing your plans
            with us.
          </p>
          <Button onClick={closeEnquiry}>Continue exploring</Button>
        </div>
      ) : (
        <>
          <p className={styles.eyebrow}>Let’s make it yours</p>
          <h2 id="enquiry-title">Plan your North India journey.</h2>
          <p className={styles.intro}>
            Tell us a little about the places and experiences you have in mind.
          </p>
          {context?.packageId && (
            <p className={styles.context}>
              Enquiry for {context.packageTitle || "your selected package"}.
            </p>
          )}
          {context?.destinationName && !context?.packageId && (
            <p className={styles.context}>
              Enquiry for {context.destinationName}.
            </p>
          )}
          <form onSubmit={submit} noValidate={false}>
            <fieldset disabled={state.loading} className={styles.fields}>
              {field("name", "Full name", {
                required: true,
                maxLength: 160,
                autoComplete: "name",
                "data-autofocus": true,
              })}
              {field("phone", "Phone number", {
                required: true,
                maxLength: 20,
                type: "tel",
                autoComplete: "tel",
              })}
              {field("email", "Email address", {
                required: true,
                maxLength: 320,
                type: "email",
                autoComplete: "email",
              })}
              <div className={styles.field}>
                <label htmlFor="enquiry-destination">
                  Destination (optional)
                </label>
                <select
                  id="enquiry-destination"
                  name="destination_id"
                  value={values.destination_id || ""}
                  onChange={update}
                  disabled={destinations.loading || Boolean(destinations.error)}
                >
                  <option value="">I’m open to ideas</option>
                  {destinations.data?.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name}
                    </option>
                  ))}
                </select>
                {destinations.error && (
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={destinations.retry}
                  >
                    Reload destination choices
                  </button>
                )}
                {errors.destination_id && (
                  <span className={styles.error}>{errors.destination_id}</span>
                )}
              </div>
              {field("travel_date", "Travel date (optional)", { type: "date" })}
              {field("travelers", "Travelers (optional)", {
                type: "number",
                min: 1,
                max: 50,
                inputMode: "numeric",
              })}
              <div className={styles.field}>
                <label htmlFor="enquiry-style">Travel style (optional)</label>
                <select
                  id="enquiry-style"
                  name="travel_type"
                  value={values.travel_type || ""}
                  onChange={update}
                >
                  <option value="">Any style</option>
                  {[
                    "family",
                    "couple",
                    "honeymoon",
                    "adventure",
                    "spiritual",
                    "luxury",
                    "group",
                    "solo",
                    "custom",
                  ].map((style) => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {field("budget", "Budget preference (optional)", {
                maxLength: 100,
              })}
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="enquiry-message">
                  Anything else you’d like us to know? (optional)
                </label>
                <textarea
                  id="enquiry-message"
                  name="message"
                  rows={3}
                  maxLength={2000}
                  value={values.message || ""}
                  onChange={update}
                />
              </div>
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="enquiry-website">Website</label>
                <input
                  id="enquiry-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website || ""}
                  onChange={update}
                />
              </div>
            </fieldset>
            {state.error && (
              <p role="alert" className={styles.error}>
                {state.error}
              </p>
            )}
            <Button type="submit" loading={state.loading}>
              Send enquiry <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <p className={styles.note}>
              This is an enquiry, not a confirmed booking.
            </p>
          </form>
        </>
      )}
    </dialog>
  );
}
