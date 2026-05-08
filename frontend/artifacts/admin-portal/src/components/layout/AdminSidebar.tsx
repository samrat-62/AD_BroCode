import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Package, 
  Truck, 
  FileText, 
  Settings, 
  Bell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Financial Reports", href: "/admin/reports/financial", icon: BarChart3 },
  { name: "Staff", href: "/admin/staff", icon: Users },
  { name: "Parts", href: "/admin/parts", icon: Package },
  { name: "Vendors", href: "/admin/vendors", icon: Truck },
  { name: "Purchase Invoices", href: "/admin/purchase-invoices", icon: FileText },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const [location] = useLocation();

  return (
    <aside 
      className={cn(
        "bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border flex flex-col",
        isOpen ? "w-60" : "w-16 lg:w-20"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
        {isOpen && (
          <div className="font-bold text-lg text-white truncate">
            AutoParts Admin
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0 ml-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "hover:bg-white/10"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isOpen && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@autoparts.com</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto">
            A
          </div>
        )}
      </div>
    </aside>
  );
}
