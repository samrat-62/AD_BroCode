import { useState } from "react";
import { useListParts, useListPartCategories, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ShoppingCart, Filter, Plus, Minus, X, Box, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [inStock, setInStock] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");

  const { data: parts, isLoading } = useListParts({ 
    search: search || undefined, 
    category, 
    inStock: inStock || undefined 
  });
  
  const { data: categories } = useListPartCategories();
  const createOrder = useCreateOrder();
  
  const { items, addItem, removeItem, updateQuantity, subtotal, discount, total, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCheckout = () => {
    if (items.length === 0) return;

    createOrder.mutate(
      {
        data: {
          items: items.map(i => ({ partId: i.partId, quantity: i.quantity })),
          deliveryType,
          paymentMethod: "cash_on_delivery" // Default for demo
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          clearCart();
          setIsCheckout(false);
          setIsCartOpen(false);
          toast({ 
            title: "Order placed successfully!", 
            description: "Your order has been confirmed."
          });
        },
        onError: () => {
          toast({ title: "Checkout failed", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 shrink-0 space-y-6">
        <div className="sticky top-20 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Categories</h2>
            <ScrollArea className="h-[200px] md:h-auto">
              <div className="space-y-2 pr-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="cat-all" 
                    checked={category === undefined}
                    onCheckedChange={() => setCategory(undefined)}
                  />
                  <label htmlFor="cat-all" className="text-sm font-medium leading-none cursor-pointer">
                    All Categories
                  </label>
                </div>
                {categories?.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${c.name}`} 
                        checked={category === c.name}
                        onCheckedChange={(checked) => setCategory(checked ? c.name : undefined)}
                      />
                      <label htmlFor={`cat-${c.name}`} className="text-sm font-medium leading-none cursor-pointer">
                        {c.name}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-3">Availability</h2>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="in-stock" 
                checked={inStock}
                onCheckedChange={(c) => setInStock(!!c)}
              />
              <label htmlFor="in-stock" className="text-sm font-medium leading-none cursor-pointer">
                In Stock Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search parts..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Sheet open={isCartOpen} onOpenChange={(open) => {
            setIsCartOpen(open);
            if (!open) setIsCheckout(false);
          }}>
            <SheetTrigger asChild>
              <Button className="gap-2 relative">
                <ShoppingCart className="h-4 w-4" />
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-foreground text-background h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>{isCheckout ? "Checkout" : "Your Cart"}</SheetTitle>
                <SheetDescription>
                  {isCheckout ? "Review your order and select delivery method." : `You have ${itemCount} items in your cart.`}
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto mt-6 -mx-6 px-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.partId} className="flex items-center gap-4 py-2">
                        <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0 border">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.partName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Box className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.partName}</h4>
                          <p className="text-sm font-semibold text-primary">{formatCurrency(item.unitPrice)}</p>
                        </div>
                        {!isCheckout && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.partId, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center text-sm">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.partId, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.partId)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {isCheckout && (
                          <div className="text-sm font-medium">x{item.quantity}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isCheckout && items.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Delivery Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 transition-colors ${deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                        onClick={() => setDeliveryType("pickup")}
                      >
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 className={`h-5 w-5 ${deliveryType === 'pickup' ? 'text-primary' : 'text-transparent'}`} />
                        </div>
                        <span className="font-medium">Workshop Pickup</span>
                        <span className="text-xs text-muted-foreground text-center">Collect your items directly from our workshop.</span>
                      </div>
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 transition-colors ${deliveryType === 'delivery' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                        onClick={() => setDeliveryType("delivery")}
                      >
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 className={`h-5 w-5 ${deliveryType === 'delivery' ? 'text-primary' : 'text-transparent'}`} />
                        </div>
                        <span className="font-medium">Home Delivery</span>
                        <span className="text-xs text-muted-foreground text-center">Fast delivery to your registered address.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t pt-4 mt-auto space-y-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Loyalty Discount (10%)</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  {isCheckout ? (
                    <Button className="w-full" size="lg" onClick={handleCheckout} disabled={createOrder.isPending}>
                      {createOrder.isPending ? "Processing..." : `Pay ${formatCurrency(total)}`}
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" onClick={() => setIsCheckout(true)}>
                      Proceed to Checkout
                    </Button>
                  )}
                  
                  {isCheckout && (
                    <Button variant="ghost" className="w-full" onClick={() => setIsCheckout(false)} disabled={createOrder.isPending}>
                      Back to Cart
                    </Button>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        ) : parts?.length === 0 ? (
          <div className="text-center py-24 border border-dashed rounded-xl bg-muted/20">
            <Box className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No parts found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              We couldn't find any parts matching your filters. Try adjusting your search or requesting a specific part.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts?.map((part) => (
              <Card key={part.id} className="flex flex-col h-full overflow-hidden group">
                <div className="aspect-square bg-white relative p-4 flex items-center justify-center border-b">
                  {part.imageUrl ? (
                    <img 
                      src={part.imageUrl} 
                      alt={part.name} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <Box className="h-16 w-16 text-muted-foreground/20" />
                  )}
                  {part.stockQty <= 0 && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm shadow-md">Out of Stock</Badge>
                    </div>
                  )}
                  {part.stockQty > 0 && part.stockQty <= 5 && (
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
                      Only {part.stockQty} left
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-muted-foreground mb-1">{part.category}</div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2" title={part.name}>{part.name}</h3>
                  <div className="text-xs text-muted-foreground font-mono mb-2">OEM: {part.partNumber}</div>
                  <div className="mt-auto font-bold text-lg text-primary">{formatCurrency(part.price)}</div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full gap-2" 
                    disabled={part.stockQty <= 0}
                    onClick={() => {
                      addItem({
                        partId: part.id,
                        partName: part.name,
                        unitPrice: part.price,
                        imageUrl: part.imageUrl
                      });
                      toast({
                        title: "Added to cart",
                        description: `${part.name} added to your cart.`,
                        duration: 2000,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
