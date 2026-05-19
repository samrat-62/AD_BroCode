import { useRoute, useLocation } from "wouter";
import { useGetPurchaseInvoice, useDeletePurchaseInvoice } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Building2, Calendar, User, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseInvoiceDetailPage() {
  const [, params] = useRoute("/admin/purchase-invoices/:id");
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const id = params?.id ?? "";
  const { data: invoice, isLoading } = useGetPurchaseInvoice({ id });
  const deleteMut = useDeletePurchaseInvoice();

  async function handleDelete() {
    if (!id) return;

    try {
      await deleteMut.mutateAsync({ id });
      toast.success("Purchase invoice deleted");
      qc.invalidateQueries({ queryKey: ["/v1/purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["/v1/parts"] });
      qc.invalidateQueries({ queryKey: ["/v1/admin/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/v1/notifications"] });
      setLocation("/admin/purchase-invoices");
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Failed to delete invoice");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/admin/purchase-invoices")}>Back to Invoices</Button>
      </div>
    );
  }

  const inv = invoice as any;
  const lineItems = (inv.lineItems ?? []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/purchase-invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{inv.invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm">Purchase Invoice Detail</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice meta */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Invoice Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="font-semibold">{inv.vendorName}</p>
                {inv.vendorPhone && <p className="text-xs text-muted-foreground">{inv.vendorPhone}</p>}
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(inv.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="font-medium">{inv.createdByName}</p>
              </div>
            </div>
            {inv.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{inv.notes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Line Items ({lineItems.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-center">Stock Before</TableHead>
                    <TableHead className="text-center">Stock After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.partName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">${item.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.stockBefore}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{item.stockAfter}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal ({lineItems.length} items)</span>
                <span className="font-semibold">${inv.totalCost.toFixed(2)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${inv.totalCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Purchase Invoice?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will reverse the stock added by the invoice and remove the invoice record.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
