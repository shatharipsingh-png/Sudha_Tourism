import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import AdminLayout from "./layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import ContentList from "./pages/ContentList";
import ContentForm from "./pages/ContentForm";
import s from "./styles/Admin.module.css";
function Protected() {
  const auth = useAdminAuth();
  const location = useLocation();
  if (auth.status === "checking")
    return (
      <main className={s.loading} role="status">
        Checking your session…
      </main>
    );
  if (auth.status !== "authenticated")
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  return <AdminLayout />;
}
export default function Admin() {
  useEffect(() => {
    const originalTitle = document.title;
    let meta = document.querySelector('meta[name="robots"]');
    const original = meta?.content;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.append(meta);
    }
    meta.content = "noindex,nofollow";
    document.title = "Admin | Sudha Tourism";
    return () => {
      if (original === undefined) meta.remove();
      else meta.content = original;
      document.title = originalTitle;
    };
  }, []);
  return (
    <div className={s.admin}>
      <AdminAuthProvider>
        <FeedbackProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              {["destinations", "packages", "experiences"].map((kind) => (
                <Route key={kind} path={kind}>
                  <Route index element={<ContentList kind={kind} />} />
                  <Route path="new" element={<ContentForm kind={kind} />} />
                  <Route
                    path=":id/edit"
                    element={<ContentForm kind={kind} />}
                  />
                </Route>
              ))}
              <Route
                path="*"
                element={
                  <div>
                    <h1>Admin page not found</h1>
                    <a href="/admin">Return to dashboard</a>
                  </div>
                }
              />
            </Route>
          </Routes>
        </FeedbackProvider>
      </AdminAuthProvider>
    </div>
  );
}
