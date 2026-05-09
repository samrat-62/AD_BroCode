import { useGetDashboardStats, useGetRecentSales, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { DollarSign, FileText, UserPlus, AlertCircle, ShoppingCart, Search, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentSales, isLoading: salesLoading } = useGetRecentSales({ limit: 5 });
  const { data: alerts, isLoading: alertsLoading } = useGetDashboardAlerts();

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="flex items-center gap-3">
          <Link href="/sales/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
          <Link href="/customers/new">
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sales Today"
          value={stats ? formatCurrency(stats.salesToday) : null}
          icon={DollarSign}
          loading={statsLoading}
        />
        <StatCard
          title="Invoices Today"
          value={stats?.invoicesToday}
          icon={FileText}
          loading={statsLoading}
        />
        <StatCard
          title="New Customers"
          value={stats?.newCustomersToday}
          icon={UserPlus}
          loading={statsLoading}
        />
        <StatCard
          title="Pending Credit"
          value={stats ? formatCurrency(stats.pendingCreditTotal) : null}
          icon={AlertCircle}
          loading={statsLoading}
          alert={stats && stats.pendingCreditTotal > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest transactions today</CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentSales && recentSales.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium text-xs">{sale.invoiceNumber}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(sale.total)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            sale.status === 'paid' ? 'default' :
                            sale.status === 'credit' ? 'destructive' : 'secondary'
                          }>
                            {sale.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No sales yet today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {alertsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    Low Stock
                    <Badge variant="outline">{alerts?.lowStock.length || 0}</Badge>
                  </h3>
                  {alerts?.lowStock && alerts.lowStock.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.lowStock.slice(0, 3).map(part => (
                        <div key={part.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 text-sm">
                          <span className="font-medium truncate pr-2" title={part.name}>{part.name}</span>
                          <span className="text-destructive font-mono shrink-0 font-bold">{part.stock} left</span>
                        </div>
                      ))}
                      {alerts.lowStock.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground pt-1">+ {alerts.lowStock.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Inventory levels looking good.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    Overdue Credits
                    <Badge variant="outline">{alerts?.overdueCredits.length || 0}</Badge>
                  </h3>
                  {alerts?.overdueCredits && alerts.overdueCredits.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.overdueCredits.slice(0, 3).map(credit => (
                        <div key={credit.customerId} className="flex justify-between items-center p-2 rounded-md bg-muted/50 text-sm">
                          <span className="font-medium truncate pr-2">{credit.fullName}</span>
                          <span className="text-destructive shrink-0 font-medium">{formatCurrency(credit.creditAmount)}</span>
                        </div>
                      ))}
                      {alerts.overdueCredits.length > 3 && (
                        <Link href="/reports">
                          <Button variant="link" className="w-full text-xs h-auto py-1 text-muted-foreground">View all {alerts.overdueCredits.length}</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No overdue accounts.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, alert }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex items-center">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
