import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { FrameworkPage } from "./pages/FrameworkPage.jsx";
import { LogicPage } from "./pages/LogicPage.jsx";
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
          <Route path="/framework" element={<FrameworkPage />} />
          <Route path="/logic" element={<LogicPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/framework.html" element={<Navigate replace to="/framework" />} />
          <Route path="/logic.html" element={<Navigate replace to="/logic" />} />
          <Route path="/assessment.html" element={<Navigate replace to="/assessment" />} />
          <Route path="/admin.html" element={<Navigate replace to="/admin" />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppShell>
    </>
  );
}
