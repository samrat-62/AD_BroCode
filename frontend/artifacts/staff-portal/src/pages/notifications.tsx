import {
  useListNotifications,
  useMarkAllNotificationsRead,
  useGetLowStockParts,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Package, AlertTriangle, AlertCircle, Info, Calendar, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading: loadingNotifs } = useListNotifications();
  const { data: lowStock, isLoading: loadingStock } = useGetLowStockParts();

  const markReadMutation = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="w-5 h-5 text-amber-500" />;
      case 'overdue_credit': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'appointment': return <Calendar className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Alerts and system messages requiring your attention.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markReadMutation.isPending}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Inbox</CardTitle>
              {unreadCount > 0 && <Badge variant="default" className="ml-auto bg-primary">{unreadCount} New</Badge>}
            </CardHeader>
            <CardContent className="p-0">
              {loadingNotifs ? (
                <div className="p-4 space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 transition-colors ${!n.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}>
                      <div className="flex gap-4">
                        <div className="mt-1 shrink-0">
                          {getIconForType(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-semibold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatDateTime(n.createdAt)}</span>
                          </div>
                          <p className={`text-sm ${!n.read ? 'text-foreground/90' : 'text-muted-foreground'}`}>{n.message}</p>
                          {n.link && (
                            <Link href={n.link}>
                              <Button variant="link" className="p-0 h-auto text-xs mt-2 text-primary">
                                View details <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-4 h-4" />
                Critical Inventory
              </CardTitle>
              <CardDescription>Parts at or below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStock ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : lowStock && lowStock.length > 0 ? (
                <div className="space-y-3">
                  {lowStock.map(part => (
                    <div key={part.id} className="flex flex-col p-3 rounded-md bg-muted/30 border border-border/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate pr-2">{part.name}</span>
                        <Badge variant={part.stock === 0 ? "destructive" : "outline"} className={part.stock > 0 ? "border-amber-500 text-amber-500" : ""}>
                          {part.stock} left
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground font-mono">
                        <span>{part.partNumber}</span>
                        <span>Reorder: {part.reorderLevel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-md">
                  Inventory levels are healthy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
