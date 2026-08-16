import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const CreatorPage = lazy(() =>
  import("./pages/CreatorPage").then((module) => ({
    default: module.CreatorPage,
  })),
);
const DiscoverPage = lazy(() =>
  import("./pages/DiscoverPage").then((module) => ({
    default: module.DiscoverPage,
  })),
);
const StudioPage = lazy(() =>
  import("./pages/StudioPage").then((module) => ({
    default: module.StudioPage,
  })),
);
const EcosystemPage = lazy(() =>
  import("./pages/EcosystemPage").then((module) => ({
    default: module.EcosystemPage,
  })),
);
const SecurityPage = lazy(() =>
  import("./pages/SecurityPage").then((module) => ({
    default: module.SecurityPage,
  })),
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="route-loader">
          <span />
          Loading VerseTip…
        </div>
      }
    >
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="ecosystem" element={<EcosystemPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path=":slug" element={<CreatorPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
