import { useState } from "react";
import { useLocation } from "wouter";
import { useListVendors, useListParts, useCreatePurchaseInvoice } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type LineItem = { partId: string; partName: string; quantity: number; unitCost: number };

export default function PurchaseInvoiceNewPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [vendorId, setVendorId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [partSearch, setPartSearch] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");

  const { data: vendors } = useListVendors({ limit: 100 });
  const { data: partsData } = useListParts({ search: partSearch || undefined, limit: 50 });
  const createMut = useCreatePurchaseInvoice();
  const parts = (partsData?.data ?? []) as any[];
  const vendorList = ((vendors as any)?.data ?? []) as any[];

  const totalCost = lineItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  function addLineItem() {
    const part = parts.find(p => p.id === selectedPartId);
    if (!part) { toast.error("Select a part first"); return; }
    if (!qty || parseInt(qty) < 1) { toast.error("Quantity must be at least 1"); return; }
    if (!cost || parseFloat(cost) <= 0) { toast.error("Enter a valid unit cost"); return; }

    const existing = lineItems.findIndex(l => l.partId === part.id);
    if (existing >= 0) {
      setLineItems(items => items.map((l, i) => i === existing ? { ...l, quantity: l.quantity + parseInt(qty), unitCost: parseFloat(cost) } : l));
    } else {
      setLineItems(items => [...items, { partId: part.id, partName: part.name, quantity: parseInt(qty), unitCost: parseFloat(cost) }]);
    }
    setSelectedPartId("");
    setQty("1");
    setCost("");
  }

  function removeLineItem(idx: number) {
    setLineItems(items => items.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!vendorId) { toast.error("Select a vendor"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item"); return; }

    try {
      const result = await createMut.mutateAsync({
        data: {
          vendorId,
          lineItems: lineItems.map(l => ({ partId: l.partId, quantity: l.quantity, unitCost: l.unitCost })),
          notes: notes || undefined,
        }
      });
      toast.success("Purchase invoice created");
      qc.invalidateQueries({ queryKey: ["/v1/purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["/v1/parts"] });
      setLocation(`/admin/purchase-invoices/${(result as any).id}`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create invoice");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/purchase-invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Purchase Invoice</h1>
          <p className="text-muted-foreground text-sm">Record a new stock purchase from a vendor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor + Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendorList.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Monthly restock order" />
              </div>
            </CardContent>
          </Card>

          {/* Add line item */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add Parts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label>Part</Label>
                  <Select value={selectedPartId} onValueChange={v => {
                    setSelectedPartId(v);
                    const p = parts.find(pt => pt.id === v);
                    if (p) setCost(String(p.unitPrice));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Search part..." /></SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input placeholder="Search..." value={partSearch} onChange={e => setPartSearch(e.target.value)} className="h-8 text-sm" />
                      </div>
                      {parts.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} <span className="text-muted-foreground ml-1">(Stock: {p.stockQuantity})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Qty</Label>
                  <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Unit Cost ($)</Label>
                  <Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} />
                </div>
              </div>
              <Button variant="outline" onClick={addLineItem} className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" /> Add to Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Line items table */}
          {lineItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.partName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeLineItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Line Items</span>
                  <span className="font-medium">{lineItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Units</span>
                  <span className="font-medium">{lineItems.reduce((s, l) => s + l.quantity, 0)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Cost</span>
                  <span className="text-primary">${totalCost.toFixed(2)}</span>
                </div>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSubmit}
                disabled={createMut.isPending || lineItems.length === 0 || !vendorId}
              >
                {createMut.isPending ? "Creating..." : "Create Invoice"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Stock levels will be updated automatically
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
