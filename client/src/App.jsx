import { Component, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnquiryProvider } from "./context/EnquiryContext";
import Layout from "./components/layout/Layout";
import { ErrorState } from "./components/common/States";
const Home = lazy(() => import("./pages/Home"));
const Placeholder = lazy(() => import("./pages/Placeholder"));
const NotFound = lazy(() => import("./pages/NotFound"));
class RouteErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="section container">
        <ErrorState
          message="This page couldn’t load."
          retry={() => window.location.reload()}
        />
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <RouteErrorBoundary>
      <BrowserRouter>
        <EnquiryProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              {[
                "destinations",
                "destinations/:slug",
                "packages",
                "packages/:slug",
                "experiences",
                "about",
                "contact",
                "privacy",
                "terms",
                "cancellation",
              ].map((path) => (
                <Route key={path} path={path} element={<Placeholder />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </EnquiryProvider>
      </BrowserRouter>
    </RouteErrorBoundary>
  );
}
