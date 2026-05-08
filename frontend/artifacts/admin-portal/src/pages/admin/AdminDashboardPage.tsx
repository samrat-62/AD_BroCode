import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, FileText, Package, AlertTriangle, Users, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={`$${summary?.totalRevenue?.toLocaleString() ?? 0}`} 
          trend={summary?.revenueChange} 
          icon={DollarSign}
          colorClass="border-chart-1"
        />
        <KPICard 
          title="Total Invoices" 
          value={summary?.totalInvoices ?? 0} 
          trend={summary?.invoicesChange} 
          icon={FileText}
          colorClass="border-chart-2"
        />
        <KPICard 
          title="Parts SKUs" 
          value={summary?.totalPartsSkus ?? 0} 
          icon={Package}
          colorClass="border-chart-3"
        />
        <KPICard 
          title="Low Stock Alerts" 
          value={summary?.lowStockAlerts ?? 0} 
          icon={AlertTriangle}
          colorClass="border-destructive"
          alert={summary?.lowStockAlerts ? summary.lowStockAlerts > 0 : false}
        />
        <KPICard 
          title="Active Staff" 
          value={summary?.activeStaff ?? 0} 
          icon={Users}
          colorClass="border-primary"
        />
        <KPICard 
          title="Active Vendors" 
          value={summary?.activeVendors ?? 0} 
          icon={Truck}
          colorClass="border-secondary"
        />
      </div>
      
      {/* Charts and tables would go here */}
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, colorClass, alert }: any) {
  return (
    <Card className={`border-l-4 ${colorClass} shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs mt-2 flex items-center ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(trend)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
