import { useAuth } from "@/hooks/use-auth";
import { Link, Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { Layout } from "@/components/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import CustomerNew from "@/pages/customer-new";
import CustomerProfile from "@/pages/customer-profile";
import SalesNew from "@/pages/sales-new";
import Invoices from "@/pages/invoices";
import InvoiceView from "@/pages/invoice-view";
import Search from "@/pages/search";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    }
  }, [token, setLocation]);

  if (!token) return null;

  return <Component {...rest} />;
}

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/customers">
          <ProtectedRoute component={Customers} />
        </Route>
        <Route path="/customers/new">
          <ProtectedRoute component={CustomerNew} />
        </Route>
        <Route path="/customers/:id">
          <ProtectedRoute component={CustomerProfile} />
        </Route>
        <Route path="/sales/new">
          <ProtectedRoute component={SalesNew} />
        </Route>
        <Route path="/invoices">
          <ProtectedRoute component={Invoices} />
        </Route>
        <Route path="/invoices/:id">
          <ProtectedRoute component={InvoiceView} />
        </Route>
        <Route path="/search">
          <ProtectedRoute component={Search} />
        </Route>
        <Route path="/reports">
          <ProtectedRoute component={Reports} />
        </Route>
        <Route path="/notifications">
          <ProtectedRoute component={Notifications} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
