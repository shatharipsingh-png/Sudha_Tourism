import { useCallback, useEffect, useState } from "react";
export function useResource(loader) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    loader: null,
  });
  useEffect(() => {
    if (!loader) {
      setState({ data: null, loading: false, error: null, loader });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null, loader });
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null, loader });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error, loader });
      });
    return () => controller.abort();
  }, [loader, version]);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  return state.loader === loader
    ? { ...state, retry }
    : { data: null, loading: Boolean(loader), error: null, retry };
}
