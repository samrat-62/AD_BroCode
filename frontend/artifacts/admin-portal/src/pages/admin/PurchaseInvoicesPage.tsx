import { useState } from "react";
import { useListPurchaseInvoices, useDeletePurchaseInvoice } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, DollarSign, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseInvoicesPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useListPurchaseInvoices({ search: search || undefined, page, limit: 20 });
  const deleteMut = useDeletePurchaseInvoice();
  const invoices = (data?.data ?? []) as any[];

  async function handleDelete(id: string) {
    try {
      await deleteMut.mutateAsync({ id });
      toast.success("Purchase invoice deleted");
      qc.invalidateQueries({ queryKey: ["/v1/purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["/v1/parts"] });
      qc.invalidateQueries({ queryKey: ["/v1/admin/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/v1/notifications"] });
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Failed to delete invoice");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Invoices</h1>
          <p className="text-muted-foreground text-sm">Manage stock restocking and supplier invoices</p>
        </div>
        <Button onClick={() => setLocation("/admin/purchase-invoices/new")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardContent className="py-4 flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="py-4 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-chart-2" />
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${((data as any)?.totalValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice #..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setLocation(`/admin/purchase-invoices/${inv.id}`)}>
                    <TableCell className="font-mono font-semibold text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{inv.vendorName}</TableCell>
                    <TableCell className="text-center">{inv.itemsCount}</TableCell>
                    <TableCell className="text-right font-semibold">${inv.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setLocation(`/admin/purchase-invoices/${inv.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(inv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No invoices found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {data && (data as any).totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {(data as any).totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page === (data as any).totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleting !== null} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Purchase Invoice?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will reverse the stock added by the invoice and remove the invoice record.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)} disabled={deleteMut.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
