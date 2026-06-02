import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { VirtualAssistant } from "@/components/VirtualAssistant";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Projects from "./pages/Projects";
import HowItWorksPage from "./pages/HowItWorksPage";
import About from "./pages/About";
import Guide from "./pages/Guide";
import Investors from "./pages/Investors";

import SuccessStories from "./pages/SuccessStories";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SubmitProject from "./pages/SubmitProject";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import News from "./pages/News";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInit from "./pages/admin/AdminInit";
import ServiceRequest from "./pages/ServiceRequest";
import ProjectDetail from "./pages/ProjectDetail";
import AccessRequest from "./pages/AccessRequest";
import ProfileSelect from "./pages/ProfileSelect";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

// Lazy load service and payment pages
const StructuringService = lazy(() => import("./pages/services/StructuringService"));
const EnterpriseService = lazy(() => import("./pages/services/EnterpriseService"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const ProjectEvaluation = lazy(() => import("./pages/ProjectEvaluation"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionCheckout = lazy(() => import("./pages/SubscriptionCheckout"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
const SubscriptionGuide = lazy(() => import("./pages/SubscriptionGuide"));
const IncubationProgram = lazy(() => import("./pages/IncubationProgram"));
const Ebook = lazy(() => import("./pages/Ebook"));
const Forum = lazy(() => import("./pages/Forum"));
const DocumentDownload = lazy(() => import("./pages/DocumentDownload"));
const Documents = lazy(() => import("./pages/Documents"));
const MiProjetPlusLanding = lazy(() => import("./pages/miprojet-plus/MiProjetPlusLanding"));
const MiProjetPlusApp = lazy(() => import("./pages/miprojet-plus/MiProjetPlusApp"));
const Journey = lazy(() => import("./pages/Journey"));
const ShortLink = lazy(() => import("./pages/ShortLink"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient();

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <MaintenanceBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile-select" element={<ProfileSelect />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/blog" element={<Navigate to="/news" replace />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/submit-project" element={<SubmitProject />} />
            <Route path="/service-request" element={<ServiceRequest />} />
            <Route path="/access-request/:projectId" element={<AccessRequest />} />
            
            {/* Service pages */}
            <Route path="/services" element={<Services />} />
            <Route path="/services/structuration" element={
              <Suspense fallback={<PageLoader />}>
                <StructuringService />
              </Suspense>
            } />
            <Route path="/services/accompagnement" element={
              <Suspense fallback={<PageLoader />}>
                <EnterpriseService />
              </Suspense>
            } />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/journey" element={
              <Suspense fallback={<PageLoader />}>
                <Journey />
              </Suspense>
            } />
            <Route path="/project-evaluation/:projectId" element={
              <Suspense fallback={<PageLoader />}>
                <ProjectEvaluation />
              </Suspense>
            } />
            
            {/* Subscription & Opportunities */}
            <Route path="/subscription" element={
              <Suspense fallback={<PageLoader />}>
                <Subscription />
              </Suspense>
            } />
            <Route path="/subscription/checkout" element={
              <Suspense fallback={<PageLoader />}>
                <SubscriptionCheckout />
              </Suspense>
            } />
            <Route path="/subscription/guide" element={
              <Suspense fallback={<PageLoader />}>
                <SubscriptionGuide />
              </Suspense>
            } />
            <Route path="/opportunities" element={
              <Suspense fallback={<PageLoader />}>
                <Opportunities />
              </Suspense>
            } />
            <Route path="/opportunities/:id" element={
              <Suspense fallback={<PageLoader />}>
                <OpportunityDetail />
              </Suspense>
            } />
            
            <Route path="/incubation" element={
              <Suspense fallback={<PageLoader />}>
                <IncubationProgram />
              </Suspense>
            } />
            <Route path="/ebook" element={
              <Suspense fallback={<PageLoader />}>
                <Ebook />
              </Suspense>
            } />
            <Route path="/forum" element={
              <Suspense fallback={<PageLoader />}>
                <Forum />
              </Suspense>
            } />
            <Route path="/documents" element={
              <Suspense fallback={<PageLoader />}>
                <Documents />
              </Suspense>
            } />
            <Route path="/documents/:id" element={
              <Suspense fallback={<PageLoader />}>
                <DocumentDownload />
              </Suspense>
            } />
            
            {/* Payment */}
            <Route path="/payment/callback" element={
              <Suspense fallback={<PageLoader />}>
                <PaymentCallback />
              </Suspense>
            } />
            
            {/* Other pages */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<News />} />
            <Route path="/actualites" element={<News />} />
            <Route path="/unsubscribe" element={
              <Suspense fallback={<PageLoader />}>
                <Unsubscribe />
              </Suspense>
            } />

            {/* Short share links: /n/art003/04/026, /o/..., /p/..., /d/... */}
            {(["n", "o", "p", "d"] as const).map((t) => (
              <Route key={t} path={`/${t}/:a/:b/:c`} element={
                <Suspense fallback={<PageLoader />}>
                  <ShortLink />
                </Suspense>
              } />
            ))}
            {(["n", "o", "p", "d"] as const).map((t) => (
              <Route key={`${t}-2`} path={`/${t}/:a/:b`} element={
                <Suspense fallback={<PageLoader />}>
                  <ShortLink />
                </Suspense>
              } />
            ))}
            {(["n", "o", "p", "d"] as const).map((t) => (
              <Route key={`${t}-1`} path={`/${t}/:a`} element={
                <Suspense fallback={<PageLoader />}>
                  <ShortLink />
                </Suspense>
              } />
            ))}
            
            {/* MiProjet+ */}
            <Route path="/miprojet-plus" element={
              <Suspense fallback={<PageLoader />}>
                <MiProjetPlusLanding />
              </Suspense>
            } />
            <Route path="/miprojet-plus/app" element={
              <Suspense fallback={<PageLoader />}>
                <MiProjetPlusApp />
              </Suspense>
            } />
            <Route path="/miprojet-plus/app/*" element={
              <Suspense fallback={<PageLoader />}>
                <MiProjetPlusApp />
              </Suspense>
            } />
            
            {/* Admin */}
            <Route path="/admin/init" element={<AdminInit />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VirtualAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
