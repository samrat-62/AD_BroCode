import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  useSearchCustomers,
  useListParts,
  useCreateSale,
  useGetCustomerVehicles,
  getGetRecentSalesQueryKey
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, CreditCard, Banknote } from "lucide-react";

type CartItem = {
  partId: string;
  partNumber: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export default function SalesNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search States
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const [partSearch, setPartSearch] = useState("");
  const debouncedPartSearch = useDebounce(partSearch, 300);

  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("card");
  const [addToCredit, setAddToCredit] = useState(false);
  const [notes, setNotes] = useState("");

  // Queries
  const { data: customers } = useSearchCustomers(
    { mode: "name", q: debouncedCustomerSearch },
    { query: { enabled: debouncedCustomerSearch.length > 2 } }
  );

  const { data: vehicles } = useGetCustomerVehicles(
    selectedCustomer?.id || "",
    { query: { enabled: !!selectedCustomer?.id } }
  );

  const { data: parts } = useListParts({ search: debouncedPartSearch });

  const createSaleMutation = useCreateSale();

  // Derived calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0), [cart]);
  const hasLoyaltyDiscount = subtotal >= 5000;
  const discountAmount = hasLoyaltyDiscount ? subtotal * 0.1 : 0;
  const total = subtotal - discountAmount;

  // Handlers
  const handleAddToCart = (part: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.partId === part.id);
      if (existing) {
        if (existing.quantity >= part.stock) {
          toast({ title: "Insufficient stock", variant: "destructive" });
          return prev;
        }
        return prev.map(i => i.partId === part.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (part.stock <= 0) {
        toast({ title: "Out of stock", variant: "destructive" });
        return prev;
      }
      return [...prev, {
        partId: part.id,
        partNumber: part.partNumber,
        name: part.name,
        unitPrice: part.unitPrice,
        quantity: 1,
        stock: part.stock
      }];
    });
  };

  const updateQuantity = (partId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.partId === partId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.stock) return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => prev.filter(item => item.partId !== partId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!selectedCustomer && !isWalkIn) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }

    const payload = {
      customerId: selectedCustomer?.id || null,
      walkInName: isWalkIn ? walkInName || "Walk-in Customer" : null,
      vehicleId: selectedVehicleId,
      items: cart.map(i => ({ partId: i.partId, quantity: i.quantity })),
      paymentMethod,
      addToCredit: selectedCustomer ? addToCredit : false,
      notes: notes || null,
    };

    createSaleMutation.mutate({ data: payload as any }, {
      onSuccess: (invoice) => {
        toast({ title: "Sale Completed", description: `Invoice ${invoice.invoice?.invoiceNumber || ''} generated.` });
        queryClient.invalidateQueries({ queryKey: getGetRecentSalesQueryKey() });
        // In a real app, open print modal here, but for now navigate to invoice
        if (invoice.invoice?.id) {
          setLocation(`/invoices/${invoice.invoice.id}`);
        } else {
          setLocation('/invoices');
        }
      },
      onError: () => {
        toast({ title: "Checkout failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 pb-24">
      {/* Left Column: Wizard Steps */}
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>

        {/* Step 1: Customer */}
        <Card className={selectedCustomer || isWalkIn ? "border-primary/50 bg-primary/5" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>1. Customer Details</span>
              {(selectedCustomer || isWalkIn) && <Check className="text-primary w-5 h-5" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer && !isWalkIn ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search registered customers by name..."
                    className="pl-9 bg-background"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                </div>
                {customerSearch.length > 2 && (
                  <div className="border rounded-md bg-card max-h-48 overflow-y-auto shadow-sm">
                    {customers?.length ? customers.map(c => (
                      <div
                        key={c.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-0 flex justify-between items-center"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <div>
                          <div className="font-medium text-foreground">{c.fullName}</div>
                          <div className="text-xs text-muted-foreground">{c.phone}</div>
                        </div>
                        {c.creditBalance > 0 && <Badge variant="destructive" className="text-[10px]">Owes {formatCurrency(c.creditBalance)}</Badge>}
                      </div>
                    )) : <div className="p-3 text-sm text-muted-foreground text-center">No customers found.</div>}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="h-px bg-border flex-1"></div>
                  <span>OR</span>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsWalkIn(true)}>
                  Proceed as Walk-in Customer
                </Button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-card p-3 rounded-md border">
                <div>
                  <div className="font-bold text-foreground">
                    {isWalkIn ? (walkInName || "Walk-in Customer") : selectedCustomer?.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {isWalkIn ? "Unregistered" : `Registered • ${selectedCustomer?.phone}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setIsWalkIn(false); setSelectedVehicleId(null); }}>
                  Change
                </Button>
              </div>
            )}

            {isWalkIn && !selectedCustomer && (
              <div className="mt-4">
                <Label className="text-xs mb-1 block">Walk-in Name (Optional)</Label>
                <Input
                  placeholder="e.g. John Smith"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="bg-background"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Vehicle (Only for registered) */}
        {selectedCustomer && (
          <Card className={selectedVehicleId ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">2. Select Vehicle (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles?.map(v => (
                  <div
                    key={v.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedVehicleId === v.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted'}`}
                    onClick={() => setSelectedVehicleId(v.id === selectedVehicleId ? null : v.id)}
                  >
                    <div className="font-mono text-xs font-bold text-primary mb-1">{v.plate}</div>
                    <div className="text-sm font-medium">{v.year} {v.make} {v.model}</div>
                  </div>
                ))}
                {!vehicles?.length && <div className="col-span-2 text-sm text-muted-foreground p-3 border border-dashed rounded-md text-center">No vehicles registered to this customer.</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Parts Selection */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">3. Select Parts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory by part number or name..."
                className="pl-9 bg-background"
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
              />
            </div>

            <div className="border rounded-md bg-card overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Part Number</th>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium text-right">Price</th>
                      <th className="px-4 py-2 font-medium text-right">Stock</th>
                      <th className="px-4 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parts?.length ? parts.map(part => {
                      const inCart = cart.find(c => c.partId === part.id)?.quantity || 0;
                      const available = part.stock - inCart;
                      return (
                        <tr key={part.id} className="hover:bg-muted/30 group">
                          <td className="px-4 py-2 font-mono text-xs">{part.partNumber}</td>
                          <td className="px-4 py-2 font-medium">{part.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(part.unitPrice)}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={available > 10 ? 'outline' : available > 0 ? 'secondary' : 'destructive'} className="font-mono">
                              {available}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              size="sm"
                              variant={inCart > 0 ? "secondary" : "default"}
                              className="w-full h-7 text-xs"
                              disabled={available <= 0}
                              onClick={() => handleAddToCart(part)}
                            >
                              {inCart > 0 ? 'Add More' : 'Add'}
                            </Button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          {partSearch ? "No parts found matching search." : "Start typing to search inventory."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Cart & Checkout (Sticky) */}
      <div className="w-full lg:w-[400px] shrink-0">
        <div className="sticky top-6">
          <Card className="border-border shadow-md">
            <CardHeader className="bg-sidebar text-sidebar-foreground rounded-t-lg pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Current Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3 bg-muted/10">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                    <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.partId} className="flex flex-col bg-card border rounded-md p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="truncate pr-2 font-medium text-sm" title={item.name}>{item.name}</div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 -mt-1 -mr-1 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.partId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-mono text-muted-foreground">{item.partNumber} • {formatCurrency(item.unitPrice)}</div>
                        <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5 bg-background shadow-sm" onClick={() => updateQuantity(item.partId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-mono w-4 text-center font-bold">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 bg-background shadow-sm" onClick={() => updateQuantity(item.partId, 1)} disabled={item.quantity >= item.stock}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t bg-card space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {hasLoyaltyDiscount && (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>−10% Loyalty Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-3 gap-2">
                    <div>
                      <RadioGroupItem value="card" id="pm-card" className="peer sr-only" />
                      <Label htmlFor="pm-card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-xs">
                        <CreditCard className="mb-1 h-5 w-5" />
                        Card
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="cash" id="pm-cash" className="peer sr-only" />
                      <Label htmlFor="pm-cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-xs">
                        <Banknote className="mb-1 h-5 w-5" />
                        Cash
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="credit" id="pm-credit" className="peer sr-only" disabled={!selectedCustomer} />
                      <Label htmlFor="pm-credit" className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary text-xs ${!selectedCustomer ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Account
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {selectedCustomer && paymentMethod !== 'credit' && (
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                    <Label htmlFor="add-to-credit" className="text-sm cursor-pointer">Add to Credit Balance</Label>
                    <Switch id="add-to-credit" checked={addToCredit} onCheckedChange={setAddToCredit} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Order Notes</Label>
                  <Textarea
                    placeholder="Optional notes for invoice..."
                    className="h-16 resize-none text-sm"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-card p-4 rounded-b-lg border-t border-border">
              <Button
                className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                disabled={cart.length === 0 || (!selectedCustomer && !isWalkIn) || createSaleMutation.isPending}
                onClick={handleCheckout}
              >
                {createSaleMutation.isPending ? "Processing..." : `Checkout ${formatCurrency(total)}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
