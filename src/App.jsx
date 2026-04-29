import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import TradeDetail from './pages/TradeDetail';
import Analytics from './pages/Analytics';
import WeeklyReview from './pages/WeeklyReview';
import CalendarReview from './pages/CalendarReview';
import ImportTrades from './pages/ImportTrades';
import Backtesting from './pages/Backtesting';
import BacktestingReplay from './pages/BacktestingReplay';
import Settings from './pages/Settings';
import RiskCalculator from './pages/RiskCalculator';
import Markets from './pages/Markets';
import ResetPassword from './pages/ResetPassword';
import AutoSync from './pages/AutoSync';
import LandingPage from './pages/LandingPage';
import Landing from './pages/Landing';
import LegalPolicy from './pages/LegalPolicy';
import PublicLegalLayout from './components/layout/PublicLegalLayout';
import { LEGAL_POLICY_ROUTES } from '@/content/legalPolicies';

const legalRoutes = LEGAL_POLICY_ROUTES.map(({ path, policyKey }) => (
  <Route key={path} path={path} element={<LegalPolicy policyKey={policyKey} />} />
));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading Trade Track Pro...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/landing-preview" element={<LandingPage />} />
        <Route element={<PublicLegalLayout />}>{legalRoutes}</Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/landing-preview" element={<LandingPage />} />
      <Route element={<PublicLegalLayout />}>{legalRoutes}</Route>
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Journal" element={<Journal />} />
        <Route path="/TradeDetail" element={<TradeDetail />} />
        <Route path="/Analytics" element={<Analytics />} />
        <Route path="/WeeklyReview" element={<WeeklyReview />} />
        <Route path="/Calendar" element={<CalendarReview />} />
        <Route path="/ImportTrades" element={<ImportTrades />} />
        <Route path="/Backtesting" element={<Backtesting />} />
        <Route path="/BacktestingReplay/:sessionId" element={<BacktestingReplay />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/RiskCalculator" element={<RiskCalculator />} />
        <Route path="/Markets" element={<Markets />} />
        <Route path="/AutoSync" element={<AutoSync />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
