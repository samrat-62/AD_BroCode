import { useState } from "react";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  low_stock: { icon: AlertTriangle, color: "text-amber-500", label: "Low Stock" },
  overdue_credit: { icon: AlertCircle, color: "text-orange-500", label: "Overdue" },
  system: { icon: Info, color: "text-blue-500", label: "System" },
  info: { icon: Info, color: "text-blue-500", label: "Info" },
  warning: { icon: AlertCircle, color: "text-orange-500", label: "Warning" },
  success: { icon: CheckCircle, color: "text-emerald-500", label: "Success" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListNotifications({
    isRead: filter === "unread" ? false : undefined,
    page,
    limit: 20,
  } as any);

  const markReadMut = useMarkNotificationRead();
  const markAllMut = useMarkAllNotificationsRead();

  const resp = data as any;
  const notifications = resp?.data ?? (Array.isArray(data) ? data : []);
  const unreadCount = resp?.unreadCount ?? 0;
  const totalPages = resp?.totalPages ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/v1/notifications"] });

  async function handleMarkRead(id: number) {
    try {
      await markReadMut.mutateAsync({ id });
      invalidate();
    } catch { toast.error("Failed to mark as read"); }
  }

  async function handleMarkAll() {
    try {
      await markAllMut.mutateAsync();
      toast.success("All notifications marked as read");
      invalidate();
    } catch { toast.error("Failed to mark all as read"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAll} disabled={markAllMut.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={v => { setFilter(v as any); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">{unreadCount} unread</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => {
                const cfg = typeConfig[n.type] ?? typeConfig["info"];
                const Icon = cfg.icon;
                const isRead = n.isRead;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-4 p-4 transition-colors",
                      !isRead && "bg-primary/5 hover:bg-primary/10",
                      isRead && "hover:bg-muted/30"
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", cfg.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn("text-sm", !isRead && "font-semibold")}>{n.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs capitalize">{cfg.label}</Badge>
                          {!isRead && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleMarkRead(n.id)}>
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
