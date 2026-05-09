import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetInvoice,
  useMarkInvoicePaid,
  useSendInvoiceEmail,
  getGetInvoiceQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Printer, Mail, CheckCircle, CreditCard, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function InvoiceView() {
  const [, params] = useRoute("/invoices/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: data, isLoading } = useGetInvoice(id!, { query: { enabled: !!id } });

  const markPaidMutation = useMarkInvoicePaid();
  const sendEmailMutation = useSendInvoiceEmail();

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("Your Invoice from AutoParts Pro");
  const [emailMessage, setEmailMessage] = useState("Please find your invoice attached.");
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  if (!id) return null;

  if (isLoading) return <div className="p-6 space-y-4 max-w-4xl mx-auto"><Skeleton className="h-32 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6 max-w-4xl mx-auto">Invoice not found.</div>;

  const { invoice, items, customer, vehicle, staffName, notes } = data;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaid = () => {
    markPaidMutation.mutate({ id: invoice.id }, {
      onSuccess: () => {
        toast({ title: "Invoice marked as paid" });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id!) });
      },
      onError: () => {
        toast({ title: "Failed to update invoice", variant: "destructive" });
      }
    });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) return;

    sendEmailMutation.mutate({
      id: invoice.id,
      data: { to: emailTo, subject: emailSubject, message: emailMessage }
    }, {
      onSuccess: () => {
        toast({ title: "Email sent successfully" });
        setIsEmailOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to send email", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between no-print mb-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <Button
              variant="outline"
              className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}

          <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Invoice via Email</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSendEmail} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>To Email</Label>
                  <Input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder={customer?.email || "customer@example.com"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    className="h-24 resize-none"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={sendEmailMutation.isPending}>
                    {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none print-section">
        <CardHeader className="border-b bg-muted/10 print:bg-transparent pb-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary mb-4">
                <FileText className="h-8 w-8" />
                <span className="font-bold text-2xl text-foreground">AutoParts Pro</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>123 Automotive Way</p>
                <p>Industrial District</p>
                <p>City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
              </div>
            </div>
            <div className="md:text-right">
              <h2 className="text-3xl font-bold uppercase tracking-wider text-muted-foreground mb-2">Invoice</h2>
              <div className="text-xl font-mono font-bold mb-4">{invoice.invoiceNumber}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{formatDateTime(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Status:</span>
                  <span>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'credit' ? 'destructive' : 'secondary'
                    } className={`print:border print:text-black ${invoice.status === 'paid' ? 'bg-emerald-500' : ''}`}>
                      {invoice.status}
                    </Badge>
                  </span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Sales Rep:</span>
                  <span className="font-medium">{staffName}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium capitalize flex items-center gap-1">
                    {invoice.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                    {invoice.paymentMethod === 'credit' && <Clock className="w-3 h-3" />}
                    {invoice.paymentMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Bill To</h3>
              {customer ? (
                <div className="space-y-1 text-sm">
                  <div className="font-bold text-base">{customer.fullName}</div>
                  {customer.phone && <div>{customer.phone}</div>}
                  {customer.email && <div>{customer.email}</div>}
                  {customer.address && <div>{customer.address}</div>}
                  {customer.nid && <div className="text-muted-foreground">ID/NID: {customer.nid}</div>}
                </div>
              ) : (
                <div className="text-sm font-medium">Walk-in Customer</div>
              )}
            </div>

            {vehicle && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Vehicle Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-bold text-base">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                  <div>Plate: <span className="font-mono font-medium">{vehicle.plate}</span></div>
                  {vehicle.color && <div>Color: {vehicle.color}</div>}
                  {vehicle.engineCc && <div>Engine: {vehicle.engineCc}cc</div>}
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-md overflow-hidden print:border-none print:border-t print:border-b print:rounded-none">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 print:bg-transparent text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold border-b">Part #</th>
                  <th className="px-4 py-3 font-bold border-b">Description</th>
                  <th className="px-4 py-3 font-bold border-b text-right">Qty</th>
                  <th className="px-4 py-3 font-bold border-b text-right">Price</th>
                  <th className="px-4 py-3 font-bold border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => (
                  <tr key={item.id} className="print:border-b">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.partNumber}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground border-b pb-2">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium border-b pb-2">
                  <span>Loyalty Discount</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <span>Total Due</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {(notes || invoice.notes) && (
          <CardFooter className="flex-col items-start bg-muted/10 print:bg-transparent border-t mt-8 p-6 text-sm">
            <div className="font-bold uppercase tracking-wider text-muted-foreground mb-2 text-xs">Notes</div>
            <p className="whitespace-pre-wrap text-muted-foreground">{notes || invoice.notes}</p>
          </CardFooter>
        )}

        <div className="hidden print:block mt-16 text-center text-sm text-muted-foreground border-t pt-8">
          Thank you for your business!
        </div>
      </Card>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}} />
    </div>
  );
}
