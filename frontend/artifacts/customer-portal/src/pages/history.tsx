import { useState } from "react";
import { useListOrders, useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { History as HistoryIcon, ShoppingBag, Wrench, Calendar, MapPin, Truck } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function HistoryPage() {
  const { data: orders, isLoading: loadingOrders } = useListOrders();
  const { data: appointments, isLoading: loadingAppointments } = useListAppointments({ status: "past" });

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing': return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/20">Processing</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getAptStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">View your past purchases and service appointments.</p>
      </div>

      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Parts and accessories you've purchased.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : orders?.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No purchase history"
                  description="You haven't ordered any parts yet."
                />
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {orders?.map(order => (
                    <AccordionItem key={order.id} value={`order-${order.id}`}>
                      <AccordionTrigger className="hover:no-underline px-4 py-3 rounded-lg hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                        <div className="flex flex-1 items-center justify-between text-left mr-4">
                          <div>
                            <div className="font-semibold text-sm">Order #{order.id.toString().padStart(5, '0')}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="font-bold text-right hidden sm:block">
                              {formatCurrency(order.total)}
                            </div>
                            {getOrderStatusBadge(order.status)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-4 border-t">
                        <div className="space-y-4">
                          <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {order.deliveryType === 'delivery' ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                              <span className="capitalize">{order.deliveryType}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ShoppingBag className="h-4 w-4" />
                              <span>{order.items.length} items</span>
                            </div>
                          </div>
                          
                          <div className="rounded-md border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Item</th>
                                  <th className="px-4 py-2 text-center font-medium">Qty</th>
                                  <th className="px-4 py-2 text-right font-medium">Price</th>
                                  <th className="px-4 py-2 text-right font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2">{item.partName}</td>
                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.unitPrice * item.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t bg-muted/20">
                                <tr>
                                  <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal:</td>
                                  <td className="px-4 py-2 text-right">{formatCurrency(order.subtotal || order.total)}</td>
                                </tr>
                                {(order.discount || 0) > 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-1 text-right text-green-600">Discount:</td>
                                    <td className="px-4 py-1 text-right text-green-600">-{formatCurrency(order.discount || 0)}</td>
                                  </tr>
                                )}
                                <tr>
                                  <td colSpan={3} className="px-4 py-2 text-right font-bold">Total:</td>
                                  <td className="px-4 py-2 text-right font-bold">{formatCurrency(order.total)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Past maintenance and repairs.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : appointments?.length === 0 ? (
                <EmptyState
                  icon={Wrench}
                  title="No service history"
                  description="You don't have any past service appointments."
                />
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {appointments?.map(apt => (
                    <AccordionItem key={apt.id} value={`apt-${apt.id}`}>
                      <AccordionTrigger className="hover:no-underline px-4 py-3 rounded-lg hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                        <div className="flex flex-1 items-center justify-between text-left mr-4">
                          <div>
                            <div className="font-semibold text-sm">{apt.serviceType}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDateTime(apt.scheduledAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium hidden sm:block">{apt.vehicleLabel}</span>
                            {getAptStatusBadge(apt.status)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-4 border-t">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground mb-1">Vehicle</div>
                              <div className="font-medium">{apt.vehicleLabel}</div>
                            </div>
                            {apt.technician && (
                              <div>
                                <div className="text-muted-foreground mb-1">Technician</div>
                                <div className="font-medium">{apt.technician}</div>
                              </div>
                            )}
                            {apt.cost != null && (
                              <div>
                                <div className="text-muted-foreground mb-1">Total Cost</div>
                                <div className="font-medium text-primary">{formatCurrency(apt.cost)}</div>
                              </div>
                            )}
                          </div>
                          
                          {apt.notes && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Service Notes</div>
                              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                {apt.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
