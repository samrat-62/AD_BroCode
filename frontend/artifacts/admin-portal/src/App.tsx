import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import StaffManagementPage from "@/pages/admin/StaffManagementPage";
import PartsManagementPage from "@/pages/admin/PartsManagementPage";
import VendorsPage from "@/pages/admin/VendorsPage";
import VendorDetailPage from "@/pages/admin/VendorDetailPage";
import PurchaseInvoicesPage from "@/pages/admin/PurchaseInvoicesPage";
import PurchaseInvoiceNewPage from "@/pages/admin/PurchaseInvoiceNewPage";
import PurchaseInvoiceDetailPage from "@/pages/admin/PurchaseInvoiceDetailPage";
import FinancialReportsPage from "@/pages/admin/FinancialReportsPage";
import NotificationsPage from "@/pages/admin/NotificationsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  if (!token) return <Redirect to="/admin/login" />;
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/admin/dashboard" />} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboardPage} />} />
      <Route path="/admin/reports/financial" component={() => <ProtectedRoute component={FinancialReportsPage} />} />
      <Route path="/admin/staff" component={() => <ProtectedRoute component={StaffManagementPage} />} />
      <Route path="/admin/parts" component={() => <ProtectedRoute component={PartsManagementPage} />} />
      <Route path="/admin/vendors/:id" component={() => <ProtectedRoute component={VendorDetailPage} />} />
      <Route path="/admin/vendors" component={() => <ProtectedRoute component={VendorsPage} />} />
      <Route path="/admin/purchase-invoices/new" component={() => <ProtectedRoute component={PurchaseInvoiceNewPage} />} />
      <Route path="/admin/purchase-invoices/:id" component={() => <ProtectedRoute component={PurchaseInvoiceDetailPage} />} />
      <Route path="/admin/purchase-invoices" component={() => <ProtectedRoute component={PurchaseInvoicesPage} />} />
      <Route path="/admin/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
