import { useState } from "react";
import { Link } from "wouter";
import { useListVehicles, useCreateVehicle, getListVehiclesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { CarFront, Plus, Settings2, Activity, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1, "License plate is required"),
  color: z.string().optional(),
  fuelType: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"]).optional(),
});

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useListVehicles();
  const createVehicle = useCreateVehicle();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      plate: "",
      color: "",
      fuelType: "Petrol",
    },
  });

  function onSubmit(values: z.infer<typeof vehicleSchema>) {
    createVehicle.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
          toast({ title: "Vehicle added successfully" });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to add vehicle", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicles and view their history.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
              <DialogDescription>
                Add a new vehicle to your profile to book services and track history.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Camry" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="BA 1 PA 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="Silver" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createVehicle.isPending}>
                    {createVehicle.isPending ? "Adding..." : "Add Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[250px] w-full rounded-xl" />)}
        </div>
      ) : vehicles?.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title="No vehicles found"
          description="Add your first vehicle to start booking services and tracking maintenance."
          action={
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Vehicle
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles?.map((vehicle, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={vehicle.id}
            >
              <Card className="flex flex-col h-full overflow-hidden group">
                <div className="aspect-video w-full bg-muted relative overflow-hidden">
                  {vehicle.photoUrl ? (
                    <img 
                      src={vehicle.photoUrl} 
                      alt={`${vehicle.make} ${vehicle.model}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <CarFront className="h-12 w-12 mb-2 opacity-20" />
                      <span className="text-sm font-medium">No photo available</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {vehicle.status === 'active' && (
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded shadow-sm">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs text-foreground">{vehicle.plate}</span>
                    <span>•</span>
                    <span>{vehicle.fuelType}</span>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4 gap-2">
                  <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <Settings2 className="h-4 w-4" /> Manage
                    </Button>
                  </Link>
                  <Link href={`/appointments?vehicleId=${vehicle.id}`} className="flex-1">
                    <Button className="w-full gap-2">
                      <Wrench className="h-4 w-4" /> Book Service
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
