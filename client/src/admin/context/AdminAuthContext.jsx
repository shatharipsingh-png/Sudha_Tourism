import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { adminRequest } from "../api.js";
const Context = createContext(null);
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState({
    status: "checking",
    admin: null,
    message: "",
    error: "",
  });
  const generation = useRef(0);
  const check = useCallback(async (signal) => {
    const version = ++generation.current;
    setSession({ status: "checking", admin: null, message: "", error: "" });
    try {
      const admin = await adminRequest("me", { signal });
      if (!signal?.aborted && version === generation.current)
        setSession({ status: "authenticated", admin, message: "", error: "" });
    } catch (error) {
      if (!signal?.aborted && version === generation.current)
        setSession({
          status: "unauthenticated",
          admin: null,
          message: "",
          error: error.status === 401 ? "" : error.message,
        });
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    return () => {
      controller.abort();
      generation.current++;
    };
  }, [check]);
  const request = useCallback(async (path, options) => {
    const version = generation.current;
    try {
      return await adminRequest(path, options);
    } catch (error) {
      if (error.status === 401 && version === generation.current) {
        generation.current++;
        setSession({
          status: "unauthenticated",
          admin: null,
          message: "Your session ended. Please sign in again.",
          error: "",
        });
      }
      throw error;
    }
  }, []);
  const login = useCallback(async (email, password) => {
    const admin = await adminRequest("login", {
      method: "POST",
      body: { email, password },
    });
    generation.current++;
    setSession({ status: "authenticated", admin, message: "", error: "" });
  }, []);
  const logout = useCallback(async () => {
    try {
      await request("logout", { method: "POST" });
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    generation.current++;
    setSession({
      status: "unauthenticated",
      admin: null,
      message: "You have signed out.",
      error: "",
    });
  }, [request]);
  return (
    <Context.Provider value={{ ...session, check, request, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useAdminAuth() {
  return useContext(Context);
}
