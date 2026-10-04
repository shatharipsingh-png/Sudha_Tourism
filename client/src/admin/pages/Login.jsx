import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Field } from "../components/Fields";
import s from "../styles/Admin.module.css";
export default function Login() {
  const auth = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const pending = useRef(false);
  const wantsLogout = location.state?.logout === true;
  useEffect(() => {
    if (!wantsLogout || auth.status !== "authenticated" || started.current)
      return;
    started.current = true;
    setBusy(true);
    auth
      .logout()
      .then(() => navigate("/admin/login", { replace: true, state: null }))
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setBusy(false));
  }, [wantsLogout, auth.status, auth.logout, navigate]);
  const from = location.state?.from;
  const target =
    typeof from === "string" &&
    /^\/admin(?:\/|$)/.test(from) &&
    !from.startsWith("/admin/login")
      ? from
      : "/admin";
  if (auth.status === "checking")
    return (
      <main className={s.loading} role="status">
        Checking your session…
      </main>
    );
  if (auth.status === "authenticated" && !wantsLogout)
    return <Navigate replace to={target} />;
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await auth.login(email.trim(), password);
      setPassword("");
    } catch (err) {
      setPassword("");
      setError(err.status === 401 ? "Invalid email or password." : err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  // A successfully signed-out page must become a regular login, not sign out again.
  if (auth.status === "authenticated" && wantsLogout && !busy && error)
    return (
      <main className={s.login}>
        <div className={s.loginCard}>
          <h1>Sign out failed</h1>
          <p role="alert" className={s.error}>
            {error}
          </p>
          <Link to="/admin">Return to dashboard</Link>
        </div>
      </main>
    );
  return (
    <main className={s.login}>
      <div className={s.loginCard}>
        <strong>Sudha Tourism</strong>
        <p className={s.muted}>Administration</p>
        <h1>Sign in</h1>
        <p className={s.muted}>Manage your content and customer enquiries.</p>
        {auth.message && <p role="status">{auth.message}</p>}
        {(error || auth.error) && (
          <p role="alert" className={s.error}>
            {error || auth.error}
          </p>
        )}
        {auth.error && (
          <button onClick={() => auth.check()}>Retry session check</button>
        )}
        <form onSubmit={submit}>
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={setEmail}
            disabled={busy}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            disabled={busy}
          />
          <button className={s.primary} disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
        <p>
          <Link to="/">Return to website</Link>
        </p>
      </div>
    </main>
  );
}
