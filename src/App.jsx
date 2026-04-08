import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { getAuthSession, loginWithPassword, logoutSession } from "./lib/auth-client.js";
import { HomePage } from "./pages/HomePage.jsx";
import { FrameworkPage } from "./pages/FrameworkPage.jsx";
import { CertificationModelPage } from "./pages/CertificationModelPage.jsx";
import { OperatingCyclePage } from "./pages/OperatingCyclePage.jsx";
import { ScoringOutputsPage } from "./pages/ScoringOutputsPage.jsx";
import { AssessmentPage } from "./pages/AssessmentPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  return (
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
  );
}

export default function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    configured: false,
    authenticated: false,
  });
  const [loggingOut, setLoggingOut] = useState(false);

  async function refreshAuth() {
    setAuthState((current) => ({ ...current, loading: true }));

    try {
      const result = await getAuthSession();
      setAuthState({
        loading: false,
        configured: result.configured,
        authenticated: result.authenticated,
      });
      return result;
    } catch {
      setAuthState({
        loading: false,
        configured: false,
        authenticated: false,
      });
      return {
        ok: false,
        configured: false,
        authenticated: false,
        message: "Unable to reach authentication service.",
      };
    }
  }

  useEffect(() => {
    void refreshAuth();
  }, []);

  async function handleLogin(password) {
    const result = await loginWithPassword(password);
    if (result.ok) {
      await refreshAuth();
    }
    return result;
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logoutSession();
    await refreshAuth();
    setLoggingOut(false);
  }

  if (!authState.authenticated) {
    return <LoginPage configured={authState.configured} loading={authState.loading} onLogin={handleLogin} />;
  }

  return (
    <>
      <ScrollToTop />
      <AppShell onLogout={handleLogout} loggingOut={loggingOut}>
        <AppRoutes />
      </AppShell>
    </>
  );
}
