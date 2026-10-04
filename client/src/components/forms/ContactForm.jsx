import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeadSubmission } from "../../hooks/useLeadSubmission";
import { contactPayload, validateContact } from "../../utils/forms";
import LeadField from "./LeadField";
import Button from "../common/Button";
import styles from "./Forms.module.css";
const initial = { name: "", email: "", phone: "", message: "", website: "" };
export default function ContactForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const lead = useLeadSubmission();
  function update(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  async function submit(event) {
    event.preventDefault();
    const feedback = validateContact(values);
    setErrors(feedback);
    if (Object.keys(feedback).length) {
      event.currentTarget
        .querySelector(`[name="${Object.keys(feedback)[0]}"]`)
        ?.focus();
      return;
    }
    if (await lead.submit(contactPayload(values))) setValues(initial);
  }
  return (
    <form onSubmit={submit} className={styles.contactForm}>
      <h2>Send us a message.</h2>
      <p className={styles.intro}>
        A question, a travel idea, or a little more information. We’re
        listening.
      </p>
      <fieldset disabled={lead.loading} className={styles.fields}>
        {[
          [
            "name",
            "Full name",
            { required: true, maxLength: 160, autoComplete: "name" },
          ],
          [
            "email",
            "Email address",
            {
              required: true,
              type: "email",
              maxLength: 320,
              autoComplete: "email",
            },
          ],
          [
            "phone",
            "Phone number (optional)",
            { type: "tel", maxLength: 20, autoComplete: "tel" },
          ],
          [
            "message",
            "Your message",
            {
              required: true,
              multiline: true,
              rows: 5,
              minLength: 10,
              maxLength: 2000,
            },
          ],
        ].map(([name, label, props]) => (
          <LeadField
            key={name}
            prefix="contact"
            name={name}
            label={label}
            value={values[name]}
            onChange={update}
            error={errors[name] || lead.errors[name]}
            {...props}
          />
        ))}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
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
      {lead.success && (
        <p role="status" className={styles.received}>
          Thank you. Your message has been received.
        </p>
      )}
      <Button type="submit" loading={lead.loading}>
        Send message <ArrowRight size={17} aria-hidden="true" />
      </Button>
      <p className={styles.note}>
        Read our <Link to="/privacy">privacy information</Link> for details
        about submitted information.
      </p>
    </form>
  );
}
