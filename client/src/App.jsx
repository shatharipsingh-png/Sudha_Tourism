import { Component, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnquiryProvider } from "./context/EnquiryContext";
import Layout from "./components/layout/Layout";
import { ErrorState } from "./components/common/States";
const Home = lazy(() => import("./pages/Home"));
const Destinations = lazy(() => import("./pages/Destinations"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const Packages = lazy(() => import("./pages/Packages"));
const PackageDetail = lazy(() => import("./pages/PackageDetail"));
const Experiences = lazy(() => import("./pages/Experiences"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
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
              <Route path="destinations" element={<Destinations />} />
              <Route
                path="destinations/:slug"
                element={<DestinationDetail />}
              />
              <Route path="packages" element={<Packages />} />
              <Route path="packages/:slug" element={<PackageDetail />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              {["privacy", "terms", "cancellation"].map((kind) => (
                <Route
                  key={kind}
                  path={kind}
                  element={<LegalPage kind={kind} />}
                />
              ))}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </EnquiryProvider>
      </BrowserRouter>
    </RouteErrorBoundary>
  );
}
