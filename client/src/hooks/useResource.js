import { useCallback, useEffect, useState } from "react";
export function useResource(loader) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [loader, version]);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, retry };
}
