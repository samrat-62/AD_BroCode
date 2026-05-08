import { useState } from "react";
import { useListVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Plus, Pencil, Trash2, Search, ExternalLink, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

type VendorForm = { name: string; contactPerson: string; phone: string; email: string; address: string; notes: string };
const emptyForm: VendorForm = { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

export default function VendorsPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useListVendors({ search: search || undefined, page, limit: 15 });
  const createMut = useCreateVendor();
  const updateMut = useUpdateVendor();
  const deleteMut = useDeleteVendor();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/v1/vendors"] });

  function openNew() { setForm(emptyForm); setEditId(null); setShowDialog(true); }
  function openEdit(v: any) { setForm({ name: v.name, contactPerson: v.contactPerson ?? "", phone: v.phone ?? "", email: v.email ?? "", address: v.address ?? "", notes: v.notes ?? "" }); setEditId(v.id); setShowDialog(true); }

  async function handleSave() {
    try {
      const payload = { name: form.name, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, notes: form.notes || undefined };
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: payload });
        toast.success("Vendor updated");
      } else {
        await createMut.mutateAsync({ data: { name: form.name, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, notes: form.notes || undefined } });
        toast.success("Vendor added");
      }
      setShowDialog(false);
      invalidate();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save vendor");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMut.mutateAsync({ id });
      toast.success("Vendor deleted");
      invalidate();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground text-sm">Manage your parts suppliers</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardContent className="py-4 flex items-center gap-4">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="py-4 flex items-center gap-4">
            <Truck className="h-8 w-8 text-chart-2" />
            <div>
              <p className="text-sm text-muted-foreground">Showing</p>
              <p className="text-2xl font-bold">{(data?.data as any[])?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Parts Supplied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((data?.data ?? []) as any[]).map((v: any) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setLocation(`/admin/vendors/${v.id}`)}>
                    <TableCell className="font-semibold text-primary">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.contactPerson ?? "—"}</TableCell>
                    <TableCell>
                      {v.phone ? <span className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{v.phone}</span> : "—"}
                    </TableCell>
                    <TableCell>
                      {v.email ? <span className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{v.email}</span> : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">{v.partsCount ?? 0}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setLocation(`/admin/vendors/${v.id}`)}><ExternalLink className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(v.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {((data?.data ?? []) as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No vendors found.</TableCell></TableRow>}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Vendor Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-primary text-primary-foreground">{editId ? "Save" : "Add Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Vendor?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)} disabled={deleteMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
