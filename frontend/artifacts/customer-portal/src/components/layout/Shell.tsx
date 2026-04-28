import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { CarFront, LayoutDashboard, Wrench, ShoppingCart, FileText, History, Star, User, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetCurrentCustomer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "My Vehicles", icon: CarFront },
  { href: "/appointments", label: "Appointments", icon: Wrench },
  { href: "/shop", label: "Parts Shop", icon: ShoppingCart },
  { href: "/requests", label: "Requests", icon: FileText },
  { href: "/history", label: "History", icon: History },
  { href: "/reviews", label: "Reviews", icon: Star },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { itemCount, clearCart } = useCart();
  const { data: customer } = useGetCurrentCustomer();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    clearCart();
    queryClient.clear();
    signOut();
    setLocation("/auth");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="p-4 border-b">
                  <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                    AutoParts
                  </Link>
                </div>
                <div className="flex flex-1 flex-col p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t p-2">
                  <Link
                    href="/profile"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.startsWith("/profile") ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    className="mt-1 w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/dashboard" className="hidden md:flex items-center gap-2 font-bold text-xl tracking-tight">
              <Wrench className="h-6 w-6 text-primary" />
              <span>AutoParts</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/shop" className="relative p-2">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {itemCount}
                </Badge>
              )}
            </Link>
            
            <NotificationDropdown />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-2 hidden h-9 w-9 rounded-full p-0 sm:flex">
                  <Avatar className="h-8 w-8 border hover:border-primary transition-colors">
                    <AvatarImage src={customer?.avatarUrl || undefined} />
                    <AvatarFallback>{customer?.fullName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span>{customer?.fullName || "User"}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {customer?.email || "Signed in"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50 pb-safe">
        <div className="flex justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg gap-1 min-w-[4rem]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
