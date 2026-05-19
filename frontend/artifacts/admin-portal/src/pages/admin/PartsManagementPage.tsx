import { useState } from "react";
import { useListParts, useListPartCategories, useCreatePart, useUpdatePart, useDeletePart, useCreatePartCategory, useDeletePartCategory, useGetLowStockParts, useListVendors } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import { toast } from "sonner";

type PartForm = { name: string; partNumber: string; categoryId: string; description: string; unitPrice: string; stockQuantity: string; reorderLevel: string; vendorId: string };
const emptyPartForm: PartForm = { name: "", partNumber: "", categoryId: "", description: "", unitPrice: "", stockQuantity: "0", reorderLevel: "5", vendorId: "" };

function stockBadge(qty: number, reorder: number) {
  if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (qty <= reorder) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Low Stock</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">In Stock</Badge>;
}

export default function PartsManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PartForm>(emptyPartForm);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const { data, isLoading } = useListParts({
    search: search || undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    stockStatus: stockFilter !== "all" ? (stockFilter as any) : undefined,
    page,
    limit: 15,
  });
  const { data: categories } = useListPartCategories();
  const { data: vendorsData, isLoading: vendorsLoading } = useListVendors({ limit: 200 });
  const vendors = vendorsData?.data ?? [];
  const { data: lowStock } = useGetLowStockParts();
  const createMut = useCreatePart();
  const updateMut = useUpdatePart();
  const deleteMut = useDeletePart();
  const createCatMut = useCreatePartCategory();
  const deleteCatMut = useDeletePartCategory();

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["/v1/parts"] }); };

  function openNew() { setForm(emptyPartForm); setEditId(null); setShowDialog(true); }
  function openEdit(p: any) {
    setForm({ name: p.name, partNumber: p.partNumber ?? "", categoryId: String(p.categoryId), description: p.description ?? "", unitPrice: String(p.unitPrice), stockQuantity: String(p.stockQuantity), reorderLevel: String(p.reorderLevel), vendorId: p.vendorId ? String(p.vendorId) : "" });
    setEditId(p.id);
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.vendorId) {
      toast.error("Select a vendor");
      return;
    }

    try {
      const payload = {
        name: form.name,
        partNumber: form.partNumber || undefined,
        categoryId: form.categoryId,
        description: form.description || undefined,
        unitPrice: parseFloat(form.unitPrice),
        stockQuantity: parseInt(form.stockQuantity),
        reorderLevel: parseInt(form.reorderLevel),
        vendorId: form.vendorId,
      };
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: payload });
        toast.success("Part updated");
      } else {
        await createMut.mutateAsync({ data: payload });
        toast.success("Part added");
      }
      setShowDialog(false);
      invalidate();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save part");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMut.mutateAsync({ id });
      toast.success("Part deleted");
      invalidate();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      await createCatMut.mutateAsync({ data: { name: newCatName.trim() } });
      toast.success("Category added");
      qc.invalidateQueries({ queryKey: ["/v1/parts/categories"] });
      setNewCatName("");
    } catch (e: any) { toast.error(e?.data?.message ?? e?.message ?? "Failed to add category"); }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCatMut.mutateAsync({ id });
      toast.success("Category deleted");
      if (categoryFilter === id) setCategoryFilter("all");
      qc.invalidateQueries({ queryKey: ["/v1/parts/categories"] });
      invalidate();
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Failed to delete category");
    } finally {
      setDeletingCategory(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parts Management</h1>
          <p className="text-muted-foreground text-sm">Manage your parts inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatDialog(true)}><Tags className="h-4 w-4 mr-2" /> Categories</Button>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Add Part</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-muted-foreground">Total SKUs</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data?.total ?? 0}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-muted-foreground">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{data?.lowStockCount ?? 0}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-muted-foreground">Categories</CardTitle><Tags className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-3xl font-bold">{(categories as any[])?.length ?? 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="low_stock">Low Stock ({lowStock?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search parts..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(categories as any[] ?? []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={v => { setStockFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All Stock" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{p.partNumber ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline">{p.categoryName}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{p.vendorName ?? "Not assigned"}</TableCell>
                        <TableCell className="text-right font-semibold">${p.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-semibold">{p.stockQuantity}</TableCell>
                        <TableCell>{stockBadge(p.stockQuantity, p.reorderLevel)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.data ?? []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No parts found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
              {data && data.totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t">
                  <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low_stock" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Reorder Level</TableHead>
                    <TableHead>Preferred Vendor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(lowStock as any[] ?? []).map((p: any) => (
                    <TableRow key={p.partId}>
                      <TableCell className="font-medium">{p.partName}</TableCell>
                      <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                      <TableCell className="text-center"><span className={p.currentStock === 0 ? "text-destructive font-bold" : "text-amber-600 font-bold"}>{p.currentStock}</span></TableCell>
                      <TableCell className="text-center">{p.reorderLevel}</TableCell>
                      <TableCell className="text-muted-foreground">{p.vendorName}</TableCell>
                    </TableRow>
                  ))}
                  {(lowStock as any[] ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">All parts are sufficiently stocked.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Part Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Part" : "Add Part"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Part Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Part Number</Label><Input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{(categories as any[] ?? []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Unit Price ($) *</Label><Input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Stock Quantity</Label><Input type="number" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1">
              <Label>Vendor *</Label>
              <Select value={form.vendorId} onValueChange={v => setForm(f => ({ ...f, vendorId: v }))} disabled={vendorsLoading || vendors.length === 0}>
                <SelectTrigger><SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Select vendor"} /></SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => <SelectItem key={vendor.id} value={String(vendor.id)}>{vendor.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {vendors.length === 0 && !vendorsLoading ? <p className="text-xs text-destructive">Create a vendor before adding parts.</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-primary text-primary-foreground">{editId ? "Save" : "Add Part"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Part?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently remove the part from inventory.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)} disabled={deleteMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Categories</DialogTitle></DialogHeader>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {(categories as any[] ?? []).length > 0 ? (
              <div className="divide-y">
                {(categories as any[] ?? []).map((category: any) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No categories found.</div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Steering" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={createCatMut.isPending} className="bg-primary text-primary-foreground">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingCategory !== null} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Category?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Only categories with no assigned parts can be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletingCategory && handleDeleteCategory(deletingCategory)}
              disabled={deleteCatMut.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
