import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSearchCustomers } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Phone, CreditCard, Car, Clock, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchPage() {
  const [mode, setMode] = useState<"name" | "phone" | "id" | "plate">("name");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [recentSearches, setRecentSearches] = useState<{mode: string, query: string}[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveSearch = (m: string, q: string) => {
    if (!q.trim() || q.length < 3) return;
    const newSearch = { mode: m, query: q };
    setRecentSearches(prev => {
      const filtered = prev.filter(s => !(s.mode === m && s.query === q));
      const updated = [newSearch, ...filtered].slice(0, 10);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const { data: results, isLoading } = useSearchCustomers(
    { mode, q: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= 2 } }
  );

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      saveSearch(mode, debouncedQuery);
    }
  }, [debouncedQuery, mode]);

  const handleRecentClick = (s: {mode: string, query: string}) => {
    setMode(s.mode as any);
    setQuery(s.query);
  };

  const getPlaceholder = () => {
    switch(mode) {
      case "name": return "Search by customer name (e.g. John Doe)";
      case "phone": return "Search by phone number (e.g. 555-0123)";
      case "id": return "Search by Customer ID or National ID";
      case "plate": return "Search by vehicle license plate";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center pt-8 pb-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Global Search</h1>
        <p className="text-muted-foreground">Quickly find customers and their vehicles.</p>
      </div>

      <div className="bg-card p-2 rounded-xl shadow-lg border border-border/50 max-w-3xl mx-auto w-full sticky top-4 z-10">
        <Tabs value={mode} onValueChange={(v: any) => { setMode(v); setQuery(""); }} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-2 bg-muted/50 p-1">
            <TabsTrigger value="name" className="text-xs sm:text-sm"><User className="w-4 h-4 mr-2 hidden sm:block" /> Name</TabsTrigger>
            <TabsTrigger value="phone" className="text-xs sm:text-sm"><Phone className="w-4 h-4 mr-2 hidden sm:block" /> Phone</TabsTrigger>
            <TabsTrigger value="id" className="text-xs sm:text-sm"><CreditCard className="w-4 h-4 mr-2 hidden sm:block" /> ID</TabsTrigger>
            <TabsTrigger value="plate" className="text-xs sm:text-sm"><Car className="w-4 h-4 mr-2 hidden sm:block" /> Plate</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-12 h-14 text-lg bg-background border-2 focus-visible:ring-offset-0 focus-visible:border-primary rounded-lg"
              placeholder={getPlaceholder()}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading && query.length >= 2 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {recentSearches.length > 0 && query.length === 0 && (
        <div className="max-w-3xl mx-auto">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-1.5 cursor-pointer hover:bg-muted font-normal border border-border/50 text-sm flex items-center gap-2"
                onClick={() => handleRecentClick(s)}
              >
                {s.mode === 'name' && <User className="w-3 h-3 text-muted-foreground" />}
                {s.mode === 'phone' && <Phone className="w-3 h-3 text-muted-foreground" />}
                {s.mode === 'id' && <CreditCard className="w-3 h-3 text-muted-foreground" />}
                {s.mode === 'plate' && <Car className="w-3 h-3 text-muted-foreground" />}
                {s.query}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && (
        <div className="max-w-3xl mx-auto space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {isLoading ? 'Searching...' : results?.length ? `Found ${results.length} results` : 'No results found'}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {results?.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full hidden sm:block">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">{customer.fullName}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.phone}</span>
                          <span className="flex items-center gap-1 font-mono"><CreditCard className="w-3 h-3"/> {customer.id.substring(0,8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden md:block text-sm space-y-1">
                        <div className="text-muted-foreground">Vehicles: <span className="font-medium text-foreground">{customer.vehiclesCount}</span></div>
                        <div className="text-muted-foreground">Balance: <span className={`font-mono font-medium ${customer.creditBalance > 0 ? 'text-destructive' : 'text-foreground'}`}>{formatCurrency(customer.creditBalance)}</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
