import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Eye, ShoppingCart, Edit, Users } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Customers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [hasCredit, setHasCredit] = useState(false);
  const [regular, setRegular] = useState(false);

  const { data: customers, isLoading } = useListCustomers({
    search: debouncedSearch,
    hasCredit: hasCredit ? true : undefined,
    regular: regular ? true : undefined,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database and credit accounts.</p>
        </div>
        <Link href="/customers/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Register Customer
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, or ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6 text-sm shrink-0 w-full sm:w-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={hasCredit} onCheckedChange={(c) => setHasCredit(!!c)} />
            Has Credit Balance
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={regular} onCheckedChange={(c) => setRegular(!!c)} />
            Regular Customers
          </label>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Vehicles</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
              <TableHead className="text-right">Credit Balance</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[30px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : customers && customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{customer.fullName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{customer.id.substring(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{customer.phone}</div>
                    {customer.email && <div className="text-xs text-muted-foreground">{customer.email}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono">{customer.vehiclesCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono font-medium ${customer.creditBalance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(customer.creditBalance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.lastVisit ? formatDate(customer.lastVisit) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/customers/${customer.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/sales/new?customerId=${customer.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            New Sale
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/customers/${customer.id}?tab=edit`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-8 w-8 mb-2 opacity-20" />
                    <p>No customers found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
