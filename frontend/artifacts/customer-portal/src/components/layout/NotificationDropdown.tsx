import { Bell, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@workspace/api-client-react";

export function NotificationDropdown() {
  const { data: notificationsData } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const notifications = Array.isArray(notificationsData)
    ? notificationsData as Notification[]
    : [];
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const handleMarkRead = (id: number) => {
    markRead.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        },
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-4 cursor-default ${!notification.read ? 'bg-muted/50' : ''}`}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="font-medium text-sm">{notification.title}</div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 -mr-2"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  {formatDateTime(notification.createdAt)}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
