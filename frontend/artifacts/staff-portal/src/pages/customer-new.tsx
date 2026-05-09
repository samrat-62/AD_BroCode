import { useLocation } from "wouter";
import { useCreateCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Car, User, DollarSign } from "lucide-react";
import { Link } from "wouter";

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1, "Plate is required"),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  engineCc: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
});

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Valid phone is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  nid: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  vehicles: z.array(vehicleSchema).default([]),
});

type FormValues = z.infer<typeof customerSchema>;

export default function CustomerNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCustomerMutation = useCreateCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      nid: "",
      dob: "",
      address: "",
      creditLimit: 0,
      notes: "",
      vehicles: [],
    },
  });

  const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  const onSubmit = (values: FormValues) => {
    // Clean up empty strings
    const cleanedValues = {
      ...values,
      email: values.email || null,
      nid: values.nid || null,
      dob: values.dob || null,
      address: values.address || null,
      notes: values.notes || null,
      creditLimit: values.creditLimit || null,
      vehicles: values.vehicles?.map(v => ({
        ...v,
        color: v.color || null,
        fuelType: v.fuelType || null,
        engineCc: v.engineCc || null,
      }))
    };

    createCustomerMutation.mutate({ data: cleanedValues as any }, {
      onSuccess: (data) => {
        toast({
          title: "Customer Registered",
          description: `${data.fullName} has been added successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setLocation(`/customers/${data.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "An error occurred while saving the customer.",
        });
        console.error(error);
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register New Customer</h1>
          <p className="text-sm text-muted-foreground">Add a new customer and their vehicles to the database.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input placeholder="john@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nid" render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID / Passport</FormLabel>
                  <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="123 Main St, City, Country" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicles
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVehicle({ make: "", model: "", year: new Date().getFullYear(), plate: "" })}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Vehicle
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {vehicleFields.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
                  No vehicles added yet. Click "Add Vehicle" to register one.
                </div>
              ) : (
                vehicleFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md bg-muted/20 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeVehicle(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="font-medium mb-4 text-sm">Vehicle #{index + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField control={form.control} name={`vehicles.${index}.make`} render={({ field }) => (
                        <FormItem><FormLabel>Make *</FormLabel><FormControl><Input placeholder="Toyota" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${index}.model`} render={({ field }) => (
                        <FormItem><FormLabel>Model *</FormLabel><FormControl><Input placeholder="Corolla" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${index}.year`} render={({ field }) => (
                        <FormItem><FormLabel>Year *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${index}.plate`} render={({ field }) => (
                        <FormItem><FormLabel>License Plate *</FormLabel><FormControl><Input placeholder="ABC-123" className="uppercase font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${index}.color`} render={({ field }) => (
                        <FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="Silver" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${index}.fuelType`} render={({ field }) => (
                        <FormItem><FormLabel>Fuel Type</FormLabel><FormControl><Input placeholder="Petrol" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="creditLimit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit (USD)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormDescription>Set to 0 for no credit facility.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl><Textarea placeholder="Any special requirements or notes..." className="resize-none" rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-card border-t shadow-lg">
            <Link href="/customers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createCustomerMutation.isPending} className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              {createCustomerMutation.isPending ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
