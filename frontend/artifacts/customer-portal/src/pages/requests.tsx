import { useState } from "react";
import { useListPartRequests, useCreatePartRequest, getListPartRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus, Search, HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";

const requestSchema = z.object({
  partName: z.string().min(2, "Part name is required"),
  partNumber: z.string().optional(),
  vehicleLabel: z.string().optional(),
  description: z.string().optional(),
});

export default function RequestsPage() {
  const { data: requests, isLoading } = useListPartRequests();
  const createRequest = useCreatePartRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      partName: "",
      partNumber: "",
      vehicleLabel: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof requestSchema>) {
    createRequest.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPartRequestsQueryKey() });
          toast({ title: "Part request submitted successfully" });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to submit request", variant: "destructive" });
        },
      }
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'found': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Found</Badge>;
      case 'unavailable': return <Badge variant="destructive">Unavailable</Badge>;
      default: return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Part Requests</h1>
          <p className="text-muted-foreground">Can't find a part in the shop? Request it here.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request a Custom Part</DialogTitle>
              <DialogDescription>
                Provide details about the part you're looking for, and our team will source it.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="partName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Name / Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Right side mirror assembly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OEM Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 87940-06120" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compatible Vehicle</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2018 Toyota Camry" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific brands, conditions (new/used), or timeframe you need this by?" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createRequest.isPending}>
                    {createRequest.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>Track the status of your special part orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded-md animate-pulse"></div>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse"></div>
              ))}
            </div>
          ) : requests?.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No requests yet"
              description="If you can't find what you're looking for in our shop, you can request it."
              action={
                <Button onClick={() => setIsCreateOpen(true)} className="mt-2">
                  Make a Request
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Info</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.partName}</div>
                        {request.partNumber && (
                          <div className="text-xs text-muted-foreground font-mono">OEM: {request.partNumber}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.vehicleLabel || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
