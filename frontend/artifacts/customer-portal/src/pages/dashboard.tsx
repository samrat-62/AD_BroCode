import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetRecentActivity, 
  useListAllPredictions,
  useGetCurrentCustomer
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calendar, ShoppingCart, Activity, AlertTriangle, 
  Wrench, FileText, ChevronRight, Award, CarFront
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: customer } = useGetCurrentCustomer();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({ limit: 5 });
  const { data: predictions, isLoading: loadingPredictions } = useListAllPredictions();

  const highRiskPredictions = predictions?.filter(p => p.riskLevel === "high" || p.riskLevel === "medium") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Alerts */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {customer?.fullName.split(' ')[0] || 'Driver'}
        </h1>
        
        {highRiskPredictions.length > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Attention Required</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                {highRiskPredictions.slice(0, 2).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                    <span className="text-sm font-medium">
                      {p.vehicleLabel}: {p.partName} ({p.riskLevel} risk)
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-background">
                      Book Service
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] w-full" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary?.lifetimeSpend || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.activeAppointments || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Upcoming services</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.loyaltyPoints || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Available to redeem</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
                <CarFront className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.vehicleCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered vehicles</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/appointments">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">Book Service</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">Shop Parts</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/requests">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">Request Part</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/vehicles">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <CarFront className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">Manage Vehicles</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activity?.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">No recent activity</div>
          ) : (
            <div className="space-y-6">
              {activity?.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id} 
                  className="flex items-start gap-4"
                >
                  <div className="mt-0.5 p-2 bg-muted rounded-full">
                    {item.type === 'purchase' && <ShoppingCart className="h-4 w-4" />}
                    {item.type === 'appointment' && <Wrench className="h-4 w-4" />}
                    {item.type === 'request' && <FileText className="h-4 w-4" />}
                    {item.type === 'review' && <Award className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span>{formatDate(item.occurredAt)}</span>
                      <span>•</span>
                      <span className="capitalize">{item.status}</span>
                      {item.amount && (
                        <>
                          <span>•</span>
                          <span className="text-foreground font-medium">{formatCurrency(item.amount)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
