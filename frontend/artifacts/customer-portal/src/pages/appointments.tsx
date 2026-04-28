import { useState } from "react";
import { 
  useListAppointments, 
  useListVehicles, 
  useCreateAppointment, 
  useCancelAppointment,
  useListAvailableTimeSlots,
  getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, CarFront, Clock, History, MapPin, Wrench, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, format as dateFnsFormat } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";

const appointmentSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Vehicle is required"),
  serviceType: z.string().min(1, "Service type is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

const serviceTypes = [
  "Regular Maintenance",
  "Oil Change",
  "Brake Inspection & Repair",
  "Engine Diagnostics",
  "Tire Rotation & Alignment",
  "AC Service",
  "Electrical System Repair",
  "Custom/Other"
];

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useListAppointments({ status: "all" });
  const { data: vehicles } = useListVehicles();
  const createAppointment = useCreateAppointment();
  const cancelAppointment = useCancelAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Need to format date properly for the API
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: availableTimeSlots } = useListAvailableTimeSlots(
    { date: formattedDate },
    { query: { enabled: !!formattedDate, queryKey: ["time-slots", formattedDate] as const } }
  );

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      notes: "",
      serviceType: "Regular Maintenance",
    },
  });

  function onSubmit(values: z.infer<typeof appointmentSchema>) {
    // Combine date and time
    const [hours, minutes] = values.time.split(':');
    const scheduledAt = new Date(values.date);
    scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    createAppointment.mutate(
      { 
        data: {
          vehicleId: values.vehicleId,
          serviceType: values.serviceType,
          scheduledAt: scheduledAt.toISOString(),
          notes: values.notes
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "Appointment booked successfully" });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to book appointment", variant: "destructive" });
        },
      }
    );
  }

  function handleCancel(id: number) {
    cancelAppointment.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "Appointment cancelled" });
        }
      }
    );
  }

  const upcoming = appointments?.filter(a => ["pending", "confirmed"].includes(a.status)) || [];
  const past = appointments?.filter(a => ["completed", "cancelled"].includes(a.status)) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Book and manage your vehicle service appointments.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <CalendarIcon className="h-4 w-4" /> Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book a Service</DialogTitle>
              <DialogDescription>
                Schedule maintenance or repairs for your vehicle.
              </DialogDescription>
            </DialogHeader>
            
            {vehicles?.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-4">You need to add a vehicle before booking an appointment.</p>
                <Button onClick={() => window.location.href = "/vehicles"}>Go to Vehicles</Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicles?.map(v => (
                              <SelectItem key={v.id} value={v.id.toString()}>
                                {v.year} {v.make} {v.model} ({v.plate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTypes.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setSelectedDate(date);
                                }}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Slot</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDate}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimeSlots?.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              )) || (
                                <SelectItem value="placeholder" disabled>Loading slots...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe any specific issues or requests" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createAppointment.isPending}>
                      {createAppointment.isPending ? "Booking..." : "Book Appointment"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past & Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming appointments"
              description="You don't have any upcoming service appointments."
            />
          ) : (
            <div className="grid gap-4">
              {upcoming.map(apt => (
                <Card key={apt.id} className="overflow-hidden border-l-4 border-l-primary">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={apt.status === 'confirmed' ? "default" : "outline"}>
                          {apt.status}
                        </Badge>
                        <h3 className="font-semibold text-lg">{apt.serviceType}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDateTime(apt.scheduledAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CarFront className="h-4 w-4" />
                        <span className="font-medium text-foreground">{apt.vehicleLabel}</span>
                      </div>
                      
                      {apt.notes && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded-md italic">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex sm:flex-col gap-2 justify-end sm:justify-start min-w-[120px]">
                      <Button variant="outline" className="w-full">Reschedule</Button>
                      <Button 
                        variant="ghost" 
                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancelAppointment.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : past.length === 0 ? (
            <EmptyState
              icon={History}
              title="No past appointments"
              description="Your completed and cancelled appointments will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {past.map(apt => (
                <Card key={apt.id} className={cn(
                  "overflow-hidden opacity-80 transition-opacity hover:opacity-100",
                  apt.status === "cancelled" ? "border-l-4 border-l-destructive/50" : "border-l-4 border-l-muted-foreground"
                )}>
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={apt.status === 'completed' ? "secondary" : "destructive"}>
                          {apt.status}
                        </Badge>
                        <h3 className="font-semibold text-lg">{apt.serviceType}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDateTime(apt.scheduledAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CarFront className="h-4 w-4" />
                        <span>{apt.vehicleLabel}</span>
                      </div>
                      
                      {apt.technician && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Wrench className="h-4 w-4" />
                          <span>Tech: {apt.technician}</span>
                        </div>
                      )}
                    </div>
                    
                    {apt.status === "completed" && (
                      <div className="flex flex-col gap-2 justify-start items-end min-w-[120px]">
                        <div className="font-semibold text-lg">{formatCurrency(apt.cost || 0)}</div>
                        {!apt.hasReview && (
                          <Button variant="outline" size="sm" className="w-full">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

