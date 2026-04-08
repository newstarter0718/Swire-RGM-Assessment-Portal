import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { FrameworkPage } from "./pages/FrameworkPage.jsx";
import { CertificationModelPage } from "./pages/CertificationModelPage.jsx";
import { OperatingCyclePage } from "./pages/OperatingCyclePage.jsx";
import { ScoringOutputsPage } from "./pages/ScoringOutputsPage.jsx";
import { AssessmentPage } from "./pages/AssessmentPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/architecture" element={<FrameworkPage />} />
          <Route path="/certification-model" element={<CertificationModelPage />} />
          <Route path="/scoring-outputs" element={<ScoringOutputsPage />} />
          <Route path="/operating-cycle" element={<OperatingCyclePage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/framework" element={<Navigate replace to="/architecture" />} />
          <Route path="/logic" element={<Navigate replace to="/scoring-outputs" />} />
          <Route path="/framework.html" element={<Navigate replace to="/architecture" />} />
          <Route path="/logic.html" element={<Navigate replace to="/scoring-outputs" />} />
          <Route path="/assessment.html" element={<Navigate replace to="/assessment" />} />
          <Route path="/admin.html" element={<Navigate replace to="/admin" />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppShell>
    </>
  );
}
