import { useRoute } from "wouter";
import { useGetVehicle, useListVehiclePredictions, useListAppointments, getGetVehicleQueryKey, getListVehiclePredictionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CarFront, AlertTriangle, Settings2, Calendar, Wrench, ChevronLeft, Droplet, Check } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/format";

export default function VehicleDetailPage() {
  const [, params] = useRoute("/vehicles/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: vehicle, isLoading: loadingVehicle } = useGetVehicle(id, {
    query: { enabled: !!id, queryKey: getGetVehicleQueryKey(id) }
  });
  
  const { data: predictions, isLoading: loadingPredictions } = useListVehiclePredictions(id, {
    query: { enabled: !!id, queryKey: getListVehiclePredictionsQueryKey(id) }
  });
  
  const { data: appointments, isLoading: loadingAppointments } = useListAppointments({ status: "all" });
  
  const vehicleAppointments = appointments?.filter(a => a.vehicleId === id) || [];

  if (loadingVehicle) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-[300px] w-full" /></div>;
  }

  if (!vehicle) {
    return <div className="text-center py-12">Vehicle not found</div>;
  }

  const highRiskPredictions = predictions?.filter(p => p.riskLevel === "high" || p.riskLevel === "medium") || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/vehicles">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
          <p className="text-muted-foreground font-mono mt-1">{vehicle.plate}</p>
        </div>
      </div>

      {highRiskPredictions.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">AI Maintenance Alert</AlertTitle>
          <AlertDescription className="mt-2">
            Based on your vehicle's history and mileage, we predict the following components need attention:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {highRiskPredictions.map(p => (
                <li key={p.id}>
                  <span className="font-medium">{p.partName}</span>: {p.recommendedAction} 
                  {p.estimatedFailureWindow && <span className="opacity-80 ml-1">({p.estimatedFailureWindow})</span>}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-0 shadow-md bg-muted/30 overflow-hidden">
          <div className="aspect-square bg-muted relative">
            {vehicle.photoUrl ? (
              <img src={vehicle.photoUrl} alt="Vehicle" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CarFront className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <CardContent className="p-6">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Make</dt>
                <dd className="font-medium">{vehicle.make}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">{vehicle.model}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Year</dt>
                <dd className="font-medium">{vehicle.year}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Fuel Type</dt>
                <dd className="font-medium">{vehicle.fuelType}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Color</dt>
                <dd className="font-medium">{vehicle.color || "N/A"}</dd>
              </div>
              <div className="flex justify-between pb-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
                    {vehicle.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service History</CardTitle>
                  <CardDescription>Past maintenance and repairs for this vehicle.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAppointments ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : vehicleAppointments.length === 0 ? (
                    <EmptyState
                      icon={Wrench}
                      title="No service history"
                      description="You haven't booked any services for this vehicle yet."
                      action={
                        <Link href="/appointments">
                          <Button className="mt-2">Book Service</Button>
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {vehicleAppointments.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map((apt, index) => (
                        <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                            {apt.status === "completed" ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-sm">{apt.serviceType}</h4>
                              <time className="text-xs font-medium text-muted-foreground">{formatDate(apt.scheduledAt)}</time>
                            </div>
                            <div className="text-sm text-muted-foreground">{apt.notes || "No notes"}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant={apt.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                                {apt.status}
                              </Badge>
                              {apt.technician && <span className="text-xs text-muted-foreground">Tech: {apt.technician}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="predictions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Predictive Maintenance</CardTitle>
                  <CardDescription>Machine learning predictions for component lifespan based on your driving patterns.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPredictions ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : predictions?.length === 0 ? (
                    <EmptyState
                      icon={Settings2}
                      title="No predictions available"
                      description="We need more data to generate predictions for this vehicle."
                    />
                  ) : (
                    <div className="space-y-4">
                      {predictions?.map(prediction => (
                        <div key={prediction.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                          <div className={`p-2 rounded-full mt-1 ${
                            prediction.riskLevel === 'high' ? 'bg-destructive/20 text-destructive' :
                            prediction.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            <Droplet className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{prediction.partName}</h4>
                              <Badge variant={
                                prediction.riskLevel === 'high' ? 'destructive' :
                                prediction.riskLevel === 'medium' ? 'default' : 'secondary'
                              }>
                                {prediction.riskLevel} risk
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{prediction.recommendedAction}</p>
                            {prediction.estimatedFailureWindow && (
                              <p className="text-xs font-medium mt-2">
                                Estimated window: {prediction.estimatedFailureWindow}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Specifications</CardTitle>
                  <CardDescription>Technical details for {vehicle.make} {vehicle.model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Engine Displacement</p>
                      <p className="font-medium">{vehicle.engineCC ? `${vehicle.engineCC} CC` : 'Unknown'}</p>
                    </div>
                    {/* Additional mocked specs could go here for the UI feel */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Transmission</p>
                      <p className="font-medium">Automatic (Mocked)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Drivetrain</p>
                      <p className="font-medium">AWD (Mocked)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

