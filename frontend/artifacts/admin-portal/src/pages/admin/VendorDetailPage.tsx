import { useRoute, useLocation } from "wouter";
import { useGetVendor } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Phone, Mail, MapPin, User, Package, FileText, DollarSign } from "lucide-react";

export default function VendorDetailPage() {
  const [, params] = useRoute("/admin/vendors/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ?? "";
  const { data: vendor, isLoading } = useGetVendor({ id });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Vendor not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/admin/vendors")}>Back to Vendors</Button>
      </div>
    );
  }

  const v = vendor as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/vendors")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{v.name}</h1>
          <p className="text-muted-foreground text-sm">Vendor Detail</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {v.contactPerson && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{v.contactPerson}</span>
              </div>
            )}
            {v.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{v.phone}</span>
              </div>
            )}
            {v.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${v.email}`} className="text-sm text-primary hover:underline">{v.email}</a>
              </div>
            )}
            {v.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">{v.address}</span>
              </div>
            )}
            {v.notes && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                <p className="text-sm">{v.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-chart-1">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Parts Supplied</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{v.partsSuppliedCount ?? (v.parts?.length ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-chart-2">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{v.purchaseInvoices?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-chart-3">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${(v.totalPurchaseValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>

          {/* Parts list */}
          {v.parts && v.parts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Parts Supplied</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {v.parts.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{p.partNumber ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={p.stockQuantity === 0 ? "destructive" : p.stockQuantity <= p.reorderLevel ? "outline" : "default"} className={p.stockQuantity > p.reorderLevel ? "bg-emerald-100 text-emerald-700" : ""}>
                            {p.stockQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${p.unitPrice?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent invoices */}
          {v.purchaseInvoices && v.purchaseInvoices.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Purchase Invoices</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {v.purchaseInvoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold">${Number(inv.totalCost).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
