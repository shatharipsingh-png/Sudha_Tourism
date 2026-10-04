import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import s from "../styles/Admin.module.css";
const Context = createContext(null);
export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState(null);
  const notify = useCallback(
    (message, error = false) => setFeedback({ message, error, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);
  return (
    <Context.Provider value={notify}>
      {children}
      <div className={s.feedback} aria-live="polite" aria-atomic="true">
        {feedback && (
          <div className={feedback.error ? s.error : s.success}>
            <span>{feedback.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setFeedback(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}
export const useFeedback = () => useContext(Context);
