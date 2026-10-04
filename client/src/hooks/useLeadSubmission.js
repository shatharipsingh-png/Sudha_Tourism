import { useCallback, useEffect, useRef, useState } from "react";
import { submitLead } from "../api/api";
const initial = { loading: false, success: false, error: "", errors: {} };
export function useLeadSubmission() {
  const [state, setState] = useState(initial);
  const request = useRef(null);
  const pending = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  const reset = useCallback(() => {
    request.current?.abort();
    request.current = null;
    pending.current = false;
    setState(initial);
  }, []);
  async function submit(payload) {
    if (pending.current) return false;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    setState({ ...initial, loading: true });
    try {
      await submitLead(payload, controller.signal);
      if (controller.signal.aborted) return false;
      setState({ ...initial, success: true });
      return true;
    } catch (error) {
      if (!controller.signal.aborted)
        setState({
          ...initial,
          error: error.message,
          errors: error.fields || {},
        });
      return false;
    } finally {
      if (request.current === controller) pending.current = false;
    }
  }
  return { ...state, submit, reset };
}
