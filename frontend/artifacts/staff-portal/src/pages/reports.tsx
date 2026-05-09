import { useState } from "react";
import {
  useGetRegularCustomersReport,
  useGetHighSpendersReport,
  useGetPendingCreditsReport,
  useGetSalesSummaryReport,
  useSendCreditReminder
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Bell, Users, TrendingUp, AlertCircle, BarChart3, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const exportCSV = (filename: string, rows: any[], headers: string[]) => {
  if (!rows || !rows.length) return;
  const csvContent = [
    headers.join(","),
    ...rows.map(row => headers.map(header => {
      // Very basic CSV escaping
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : "";
      return `"${val.replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Reports() {
  const { toast } = useToast();

  // Queries
  const { data: regularData, isLoading: loadingReg } = useGetRegularCustomersReport({ minVisits: 2 });
  const { data: spendersData, isLoading: loadingSpend } = useGetHighSpendersReport({ limit: 10 });
  const { data: creditsData, isLoading: loadingCredit } = useGetPendingCreditsReport();
  const { data: salesData, isLoading: loadingSales } = useGetSalesSummaryReport();

  const sendReminderMutation = useSendCreditReminder();

  const handleSendReminder = (customerId: string, email?: string | null) => {
    if (!email) {
      toast({ title: "No email address", description: "Customer does not have an email address on file.", variant: "destructive" });
      return;
    }

    sendReminderMutation.mutate({ data: { to: email, subject: "Overdue Account Balance", message: "Reminder about overdue balance." } }, {
      onSuccess: () => toast({ title: "Reminder sent" }),
      onError: () => toast({ title: "Failed to send reminder", variant: "destructive" })
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Insights into business performance and customer accounts.</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start h-auto p-1 overflow-x-auto">
          <TabsTrigger value="sales" className="py-2 px-4"><BarChart3 className="w-4 h-4 mr-2" /> Sales Summary</TabsTrigger>
          <TabsTrigger value="credits" className="py-2 px-4"><AlertCircle className="w-4 h-4 mr-2" /> Pending Credits</TabsTrigger>
          <TabsTrigger value="spenders" className="py-2 px-4"><TrendingUp className="w-4 h-4 mr-2" /> High Spenders</TabsTrigger>
          <TabsTrigger value="regular" className="py-2 px-4"><Users className="w-4 h-4 mr-2" /> Regular Customers</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Sales Summary Tab */}
          <TabsContent value="sales" className="m-0 space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => exportCSV('sales_daily', salesData?.dailySales || [], ['date', 'total', 'invoices'])} disabled={!salesData}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            {loadingSales ? <Skeleton className="h-[400px] w-full" /> : salesData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Total Sales</div>
                        <div className="text-2xl font-bold">{formatCurrency(salesData.totalSales)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Invoices Generated</div>
                        <div className="text-2xl font-bold font-mono">{salesData.totalInvoices}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Avg. Sale Value</div>
                        <div className="text-2xl font-bold">{formatCurrency(salesData.avgSaleValue)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData.dailySales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tickFormatter={(val) => formatDate(val)} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis tickFormatter={(val) => `$${val}`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                            labelFormatter={(label) => formatDate(label)}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          />
                          <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Parts</CardTitle>
                    <CardDescription>By revenue generated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {salesData.topParts.map((part, i) => (
                        <div key={part.partId} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-sm font-bold text-muted-foreground w-4">{i + 1}.</div>
                            <div>
                              <div className="font-medium text-sm truncate max-w-[150px]">{part.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{part.partNumber}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-primary">{formatCurrency(part.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{part.quantitySold} units</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Pending Credits Tab */}
          <TabsContent value="credits" className="m-0 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Accounts with outstanding balances sorted by days overdue.</div>
              <Button variant="outline" onClick={() => exportCSV('pending_credits', creditsData || [], ['customerId', 'fullName', 'phone', 'email', 'creditAmount', 'daysOverdue'])} disabled={!creditsData}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCredit ? <TableRow><TableCell colSpan={6}><Skeleton className="h-20 w-full" /></TableCell></TableRow> :
                    creditsData?.length ? creditsData.map(row => (
                      <TableRow key={row.customerId}>
                        <TableCell>
                          <Link href={`/customers/${row.customerId}`} className="font-medium hover:underline text-primary">{row.fullName}</Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{row.phone}</div>
                          {row.email && <div className="text-xs text-muted-foreground">{row.email}</div>}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-destructive">
                          {formatCurrency(row.creditAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              row.daysOverdue >= 60 ? "border-red-500 text-red-500 bg-red-500/10" :
                              row.daysOverdue >= 30 ? "border-amber-500 text-amber-500 bg-amber-500/10" :
                              "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                            }
                          >
                            {row.daysOverdue} days overdue
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.lastPaymentDate ? formatDate(row.lastPaymentDate) : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleSendReminder(row.customerId, row.email)} disabled={sendReminderMutation.isPending || !row.email}>
                            <Mail className="w-4 h-4 mr-2" /> Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending credits found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* High Spenders Tab */}
          <TabsContent value="spenders" className="m-0 space-y-4">
             <div className="flex justify-end">
              <Button variant="outline" onClick={() => exportCSV('high_spenders', spendersData || [], ['customerId', 'fullName', 'totalSpend', 'avgPerVisit', 'visitCount'])} disabled={!spendersData}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            {loadingSpend ? <Skeleton className="h-[400px] w-full" /> : spendersData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Spenders</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendersData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(val) => `$${val}`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis type="category" dataKey="fullName" width={120} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Total Spend"]}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        />
                        <Bar dataKey="totalSpend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <div className="overflow-x-auto h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Total Spend</TableHead>
                          <TableHead className="text-right">Visits</TableHead>
                          <TableHead className="text-right">Avg / Visit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spendersData.map(row => (
                          <TableRow key={row.customerId}>
                            <TableCell className="font-medium">{row.fullName}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatCurrency(row.totalSpend)}</TableCell>
                            <TableCell className="text-right font-mono">{row.visitCount}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(row.avgPerVisit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Regular Customers Tab */}
          <TabsContent value="regular" className="m-0 space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => exportCSV('regular_customers', regularData || [], ['customerId', 'fullName', 'phone', 'visitCount', 'totalSpend', 'lastVisit'])} disabled={!regularData}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">Total Spend</TableHead>
                      <TableHead>Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingReg ? <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow> :
                    regularData?.length ? regularData.map(row => (
                      <TableRow key={row.customerId}>
                        <TableCell>
                          <Link href={`/customers/${row.customerId}`} className="font-medium hover:underline text-primary">{row.fullName}</Link>
                        </TableCell>
                        <TableCell className="text-sm">{row.phone}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{row.visitCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalSpend)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(row.lastVisit)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No regular customers found matching criteria.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
