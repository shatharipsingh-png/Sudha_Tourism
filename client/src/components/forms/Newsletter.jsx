import { useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { submitLead } from "../../api/api";
import styles from "./Forms.module.css";
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({
    loading: false,
    message: "",
    error: false,
  });
  const pending = useRef(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    controller.current = new AbortController();
    setState({ loading: true, message: "", error: false });
    try {
      await submitLead(
        { type: "newsletter", email: email.trim(), consent },
        controller.current.signal,
      );
      setEmail("");
      setConsent(false);
      setState({
        loading: false,
        message: "Thank you. Your subscription request has been received.",
        error: false,
      });
    } catch (error) {
      if (error.name !== "AbortError")
        setState({ loading: false, message: error.message, error: true });
    } finally {
      pending.current = false;
    }
  }
  return (
    <form onSubmit={submit} className={styles.newsletter}>
      <label htmlFor="newsletter-email" className="sr-only">
        Newsletter email address
      </label>
      <div className={styles.newsletterInput}>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={320}
          disabled={state.loading}
        />
        <button
          type="submit"
          disabled={state.loading || !consent}
          aria-label="Subscribe to newsletter"
        >
          {state.loading ? (
            <LoaderCircle size={20} aria-hidden="true" />
          ) : (
            <ArrowRight size={20} aria-hidden="true" />
          )}
        </button>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
          disabled={state.loading}
        />
        I agree to receive travel emails.
      </label>
      <Link to="/privacy" className={styles.privacy}>
        Read our privacy information
      </Link>
      <p
        aria-live="polite"
        role={state.error ? "alert" : "status"}
        className={styles.newsletterStatus}
      >
        {state.message}
      </p>
    </form>
  );
}
