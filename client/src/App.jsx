import { Component, lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
} from "react-router-dom";
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
const Admin = lazy(() => import("./admin/Admin"));
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
function RootRoutes() {
  return (
    <RouteErrorBoundary>
      <EnquiryProvider>
        <Routes>
          <Route
            path="admin/*"
            element={
              <Suspense
                fallback={
                  <main className="section container" role="status">
                    Loading admin…
                  </main>
                }
              >
                <Admin />
              </Suspense>
            }
          />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="destinations/:slug" element={<DestinationDetail />} />
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
    </RouteErrorBoundary>
  );
}
// A data router supplies the supported navigation blocker for unsaved CMS forms.
const router = createBrowserRouter([{ path: "*", element: <RootRoutes /> }]);
export default function App() {
  return <RouterProvider router={router} />;
}
