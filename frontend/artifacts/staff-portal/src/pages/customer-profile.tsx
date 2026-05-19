import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetCustomer,
  useGetCustomerVehicles,
  useGetCustomerPurchases,
  useGetCustomerServices,
  useGetCustomerCredit,
  useGetCustomerNotes,
  useAddCustomerNote
} from "@workspace/api-client-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, ShoppingCart, Car, Plus, FileText, Send, Calendar, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCustomerNotesQueryKey } from "@workspace/api-client-react";

export default function CustomerProfile() {
  const [, params] = useRoute("/customers/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useGetCustomer(id!, { query: { enabled: !!id } });
  const { data: vehicles, isLoading: vehiclesLoading } = useGetCustomerVehicles(id!, { query: { enabled: !!id } });
  const { data: purchases, isLoading: purchasesLoading } = useGetCustomerPurchases(id!, { query: { enabled: !!id } });
  const { data: services, isLoading: servicesLoading } = useGetCustomerServices(id!, { query: { enabled: !!id } });
  const { data: credit, isLoading: creditLoading } = useGetCustomerCredit(id!, { query: { enabled: !!id } });
  const { data: notes, isLoading: notesLoading } = useGetCustomerNotes(id!, { query: { enabled: !!id } });

  const addNoteMutation = useAddCustomerNote();
  const [newNote, setNewNote] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addNoteMutation.mutate({ id: id!, data: { body: newNote } }, {
      onSuccess: () => {
        setNewNote("");
        queryClient.invalidateQueries({ queryKey: getGetCustomerNotesQueryKey(id!) });
        toast({ title: "Note added" });
      }
    });
  };

  if (!id) return null;

  if (profileLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!profile) return <div className="p-6">Customer not found.</div>;

  const { customer, totalSpend, memberSince } = profile;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/customers">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Customer Profile</h1>
      </div>

      {/* Header Card */}
      <Card className="border-t-4 border-t-primary overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 flex gap-3">
          <Link href={`/sales/new?customerId=${id}`}>
            <Button className="bg-primary hover:bg-primary/90">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
          <Button variant="outline">Edit Profile</Button>
        </div>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-bold">{customer.fullName}</h2>
                <div className="text-muted-foreground font-mono text-sm mt-1">ID: {customer.id}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" /> {customer.phone}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" /> {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> {customer.address}
                  </div>
                )}
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> Member since {formatDate(memberSince)}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-4 md:w-48 shrink-0">
              <div className="bg-muted/50 p-4 rounded-lg flex-1 border border-border">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Spend</div>
                <div className="text-xl font-bold font-mono">{formatCurrency(totalSpend)}</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg flex-1 border border-border">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Credit Balance</div>
                <div className={`text-xl font-bold font-mono ${customer.creditBalance > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                  {formatCurrency(customer.creditBalance)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Limit: {formatCurrency(customer.creditLimit)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start h-auto p-1 overflow-x-auto">
          <TabsTrigger value="vehicles" className="py-2 px-4"><Car className="w-4 h-4 mr-2" /> Vehicles</TabsTrigger>
          <TabsTrigger value="purchases" className="py-2 px-4"><ShoppingCart className="w-4 h-4 mr-2" /> Purchase History</TabsTrigger>
          <TabsTrigger value="services" className="py-2 px-4"><FileText className="w-4 h-4 mr-2" /> Service History</TabsTrigger>
          <TabsTrigger value="credit" className="py-2 px-4"><CreditCard className="w-4 h-4 mr-2" /> Credit & Payments</TabsTrigger>
          <TabsTrigger value="notes" className="py-2 px-4"><FileText className="w-4 h-4 mr-2" /> Notes</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="vehicles" className="m-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Vehicles</CardTitle>
                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Vehicle</Button>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? <Skeleton className="h-32 w-full" /> : vehicles?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map(v => (
                      <div key={v.id} className="border rounded-lg p-4 bg-muted/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 rounded-bl-lg font-mono text-sm font-bold border-b border-l border-primary/20">
                          {v.plate}
                        </div>
                        <div className="text-lg font-bold mb-1 mt-2">{v.year} {v.make}</div>
                        <div className="text-muted-foreground font-medium mb-3">{v.model}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {v.color && <div>Color: <span className="text-foreground">{v.color}</span></div>}
                          {v.fuelType && <div>Fuel: <span className="text-foreground">{v.fuelType}</span></div>}
                          {v.engineCc && <div>Engine: <span className="text-foreground">{v.engineCc}cc</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No vehicles registered.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="m-0">
             <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? <Skeleton className="h-64 w-full" /> : purchases?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDateTime(p.createdAt)}</TableCell>
                          <TableCell className="font-mono">{p.referenceNumber}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{p.source}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                          <TableCell className="capitalize">{p.paymentMethod.replaceAll("_", " ")}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(p.total)}</TableCell>
                          <TableCell className="text-right">
                            {p.source === "invoice" ? (
                              <Link href={`/invoices/${p.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">Customer order</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No purchases found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional tabs (services, credit, notes) follow the same pattern */}
          <TabsContent value="notes" className="m-0">
             <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <Input
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={addNoteMutation.isPending || !newNote.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Add
                  </Button>
                </form>

                <div className="space-y-4">
                  {notesLoading ? <Skeleton className="h-24 w-full" /> : notes?.length ? (
                    notes.map(note => (
                      <div key={note.id} className="p-4 border rounded-md bg-muted/30">
                        <p className="text-sm whitespace-pre-wrap mb-3">{note.body}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDateTime(note.createdAt)}</span>
                          <span>by {note.author}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No notes available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="m-0">
             <Card>
              <CardHeader>
                <CardTitle>Service History</CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? <Skeleton className="h-64 w-full" /> : services?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{formatDate(s.date)}</TableCell>
                          <TableCell>{s.serviceType}</TableCell>
                          <TableCell>{s.technician}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(s.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No service history.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit" className="m-0">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Credit Account</CardTitle>
                <Button size="sm"><DollarSign className="w-4 h-4 mr-2" /> Record Payment</Button>
              </CardHeader>
              <CardContent>
                {creditLoading ? <Skeleton className="h-64 w-full" /> : credit?.transactions?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes / Ref</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credit.transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{formatDateTime(t.date)}</TableCell>
                          <TableCell>
                            <Badge variant={t.type === 'payment' ? 'default' : 'secondary'} className={t.type === 'payment' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{t.notes || t.invoiceId || '-'}</TableCell>
                          <TableCell className={`text-right font-medium ${t.type === 'payment' ? 'text-emerald-500' : ''}`}>
                            {t.type === 'payment' ? '-' : ''}{formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatCurrency(t.balanceAfter)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No credit history.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
