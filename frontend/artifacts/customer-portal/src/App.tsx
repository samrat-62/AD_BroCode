import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";

// Layout
import { Shell } from "@/components/layout/Shell";

// Pages
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import VehicleDetailPage from "@/pages/vehicle-detail";
import AppointmentsPage from "@/pages/appointments";
import ShopPage from "@/pages/shop";
import RequestsPage from "@/pages/requests";
import HistoryPage from "@/pages/history";
import ReviewsPage from "@/pages/reviews";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { useAuthStatus } from "@/lib/auth";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const [, setLocation] = useLocation();
  const isAuthenticated = useAuthStatus();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/vehicles" component={VehiclesPage} />
        <Route path="/vehicles/:id" component={VehicleDetailPage} />
        <Route path="/appointments" component={AppointmentsPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/:rest*" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
