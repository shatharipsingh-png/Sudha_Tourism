import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
const Context = createContext(null);
export function EnquiryProvider({ children }) {
  const [context, setContext] = useState(null);
  const openEnquiry = useCallback((options) => setContext(options || {}), []);
  const closeEnquiry = useCallback(() => setContext(null), []);
  const value = useMemo(
    () => ({ context, open: context !== null, openEnquiry, closeEnquiry }),
    [context, openEnquiry, closeEnquiry],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useEnquiry() {
  const value = useContext(Context);
  if (!value) throw new Error("useEnquiry requires EnquiryProvider.");
  return value;
}
