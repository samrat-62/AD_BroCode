import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPartRequests, useUpdatePartRequestStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { toast } from "sonner";

type RequestStatus = "all" | "pending" | "acknowledged" | "found" | "unavailable";

function statusBadge(status: string) {
  switch (status) {
    case "acknowledged":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Acknowledged</Badge>;
    case "found":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Found</Badge>;
    case "unavailable":
      return <Badge variant="destructive">Unavailable</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function PartRequestsPage() {
  const [status, setStatus] = useState<RequestStatus>("pending");
  const { data, isLoading } = useListPartRequests({
    status: status === "all" ? undefined : status,
    page: 1,
    limit: 50,
  });
  const updateStatus = useUpdatePartRequestStatus();
  const queryClient = useQueryClient();
  const requests = data?.data ?? [];

  const handleStatusChange = (id: string, nextStatus: string) => {
    updateStatus.mutate(
      { id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/v1/part-requests"] });
          queryClient.invalidateQueries({ queryKey: ["/v1/notifications"] });
          toast.success("Part request updated");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update part request");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Part Requests</h1>
          <p className="text-muted-foreground text-sm">Review customer part requests and update their status.</p>
        </div>
        <Select value={status} onValueChange={value => setStatus(value as RequestStatus)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="found">Found</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageSearch className="h-5 w-5" />
            Customer Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : requests.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.partName}</div>
                        {request.partNumber ? <div className="text-xs text-muted-foreground font-mono">OEM: {request.partNumber}</div> : null}
                        {request.description ? <div className="text-xs text-muted-foreground max-w-[320px] truncate">{request.description}</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.customerName}</div>
                        <div className="text-xs text-muted-foreground">{request.phone}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{request.vehicleLabel || "-"}</TableCell>
                      <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                      <TableCell>{statusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.status !== "acknowledged" && (
                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => handleStatusChange(request.id, "acknowledged")}>
                              Acknowledge
                            </Button>
                          )}
                          <Button size="sm" disabled={updateStatus.isPending} onClick={() => handleStatusChange(request.id, "found")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Found
                          </Button>
                          <Button size="sm" variant="destructive" disabled={updateStatus.isPending} onClick={() => handleStatusChange(request.id, "unavailable")}>
                            Unavailable
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
              No part requests found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
