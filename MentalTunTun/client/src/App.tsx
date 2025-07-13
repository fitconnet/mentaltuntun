import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  enforceHTTPS,
  validateEnvironmentVariables,
} from "@/lib/securityRules";

import { TopSidebar } from "@/components/navigation/TopSidebar";
import Footer from "@/components/Footer";

// Pages (리팩터링: 중앙화된 import로 가독성 향상)
import {
  LoginPage,
  HomePage,
  DashboardPage,
  PersonalityPage,
  PersonalityOverviewPage,
  PersonalityCategoryPage,
  PersonalityDetailPage,
  RealtimeAnalysisPage,
  EmotionsPage,
  SchedulePage,
  CounselingPage,
  AdminPage,
  FirebaseTestPage,
  ProfilePage,
  SelfDiscoveryPage,
  SettingsPage,
  SubscriptionPage,
  SubscriptionPremiumPage,
  SupportPage,
  PsychologicalTestsPage,
  PsychologicalTestDetailPage,
  ContentPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  NaverConsentPage,
  GoogleConsentPage,
  KakaoConsentPage,
  PhoneUsagePage,
  NotFound,
} from "@/pages";

// 관리자 컴포넌트 (별도 import 유지)
import FirebaseAdminDashboard from "@/components/admin/FirebaseAdminDashboard";

function Router() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <div className="flex flex-col min-h-screen">
      {!isLoginPage && <TopSidebar />}
      <main className={`flex-grow ${isLoginPage ? "" : "pt-16"}`}>
        {/* Add padding-top to account for fixed header only when not login page */}
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/" component={HomePage} />
          <Route
            path="/personality/overview"
            component={PersonalityOverviewPage}
          />
          <Route
            path="/personality/category/:category"
            component={PersonalityCategoryPage}
          />
          <Route
            path="/personality/detail/:category/:keyword"
            component={PersonalityDetailPage}
          />
          <Route
            path="/personality/realtime-analysis"
            component={RealtimeAnalysisPage}
          />
          <Route path="/personality" component={PersonalityPage} />
          <Route path="/emotions" component={EmotionsPage} />
          <Route path="/schedule" component={SchedulePage} />
          <Route
            path="/psychological-tests"
            component={PsychologicalTestsPage}
          />
          <Route
            path="/psychological-tests/:category/:testId"
            component={PsychologicalTestDetailPage}
          />
          <Route path="/content" component={ContentPage} />
          <Route path="/self-discovery" component={SelfDiscoveryPage} />
          <Route path="/counseling" component={CounselingPage} />
          <Route path="/subscription" component={SubscriptionPage} />
          <Route
            path="/subscription/premium"
            component={SubscriptionPremiumPage}
          />
          <Route path="/support" component={SupportPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/firebase-test" component={FirebaseTestPage} />
          <Route path="/firebase-admin" component={FirebaseAdminDashboard} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/terms-of-service" component={TermsOfServicePage} />
          <Route path="/oauth/naver-consent" component={NaverConsentPage} />
          <Route path="/oauth/google-consent" component={GoogleConsentPage} />
          <Route path="/oauth/kakao-consent" component={KakaoConsentPage} />
          <Route path="/phone-usage" component={PhoneUsagePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
