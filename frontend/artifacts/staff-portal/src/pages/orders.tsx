import { useState } from "react";
import {
  getListCustomerOrdersQueryKey,
  useListCustomerOrders,
  useUpdateCustomerOrderStatus,
  type CustomerOrder,
} from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";

type OrderFilter = "all" | "pending" | "processing" | "delivered" | "cancelled";

const filters: Array<{ value: OrderFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function statusBadge(status: CustomerOrder["status"]) {
  switch (status) {
    case "delivered":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Delivered</Badge>;
    case "processing":
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/20">Processing</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function paymentLabel(method: CustomerOrder["paymentMethod"]) {
  return method === "cash_on_delivery"
    ? "Cash on Delivery"
    : method === "cash"
      ? "Pay at Workshop"
      : method.charAt(0).toUpperCase() + method.slice(1);
}

export default function Orders() {
  const [status, setStatus] = useState<OrderFilter>("pending");
  const { data: orders, isLoading } = useListCustomerOrders({ status });
  const updateStatus = useUpdateCustomerOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusUpdate = (order: CustomerOrder, nextStatus: "pending" | "delivered") => {
    updateStatus.mutate(
      { id: order.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomerOrdersQueryKey() });
          toast({ title: nextStatus === "delivered" ? "Order marked delivered" : "Order moved to pending" });
        },
        onError: (error) => {
          toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Orders</h1>
          <p className="text-muted-foreground">Review customer portal orders and update delivery status.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-card p-3 rounded-lg border border-border">
        {filters.map(filter => (
          <Button
            key={filter.value}
            variant={status === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : orders?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-mono font-medium">{order.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{order.items.length} item{order.items.length === 1 ? "" : "s"}</div>
                        <div className="text-xs text-muted-foreground max-w-[220px] truncate">
                          {order.items.map(item => `${item.partName} x${item.quantity}`).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 capitalize">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {order.deliveryType}
                        </div>
                      </TableCell>
                      <TableCell>{paymentLabel(order.paymentMethod)}</TableCell>
                      <TableCell>{statusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-right">
                        {order.status === "delivered" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateStatus.isPending}
                            onClick={() => handleStatusUpdate(order, "pending")}
                          >
                            Set Pending
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={updateStatus.isPending}
                            onClick={() => handleStatusUpdate(order, "delivered")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Delivered
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
              No customer orders found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
