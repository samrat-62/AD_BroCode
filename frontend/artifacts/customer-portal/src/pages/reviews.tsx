import { useState } from "react";
import { 
  useListMyReviews, 
  useListAppointments, 
  useCreateReview, 
  getListMyReviewsQueryKey,
  getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, Plus, PenLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";

const reviewSchema = z.object({
  appointmentId: z.coerce.number().min(1, "Please select an appointment"),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().min(2, "Title is required").optional(),
  body: z.string().min(10, "Please provide a detailed review"),
});

export default function ReviewsPage() {
  const { data: reviews, isLoading: loadingReviews } = useListMyReviews();
  const { data: appointments, isLoading: loadingAppointments } = useListAppointments({ status: "past" });
  
  const createReview = useCreateReview();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter completed appointments that don't have a review yet
  const eligibleAppointments = appointments?.filter(a => a.status === 'completed' && !a.hasReview) || [];

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      title: "",
      body: "",
    },
  });

  function onSubmit(values: z.infer<typeof reviewSchema>) {
    createReview.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyReviewsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "Review submitted successfully" });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to submit review", variant: "destructive" });
        },
      }
    );
  }

  const RatingStars = ({ rating, onChange }: { rating: number, onChange?: (r: number) => void }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-5 w-5 ${onChange ? 'cursor-pointer' : ''} ${
              star <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground opacity-30'
            }`}
            onClick={() => onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">Share your feedback on past services.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <PenLine className="h-4 w-4" /> Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Your feedback helps us improve our services.
              </DialogDescription>
            </DialogHeader>
            
            {eligibleAppointments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-4">You don't have any unreviewed completed services.</p>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Close</Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="appointmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service to Review</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a past service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eligibleAppointments.map(a => (
                              <SelectItem key={a.id} value={a.id.toString()}>
                                {formatDateTime(a.scheduledAt)} - {a.serviceType}
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
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <RatingStars 
                              rating={field.value} 
                              onChange={(val) => field.onChange(val)} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Excellent service!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what you liked or what could be improved..." 
                            className="resize-none h-24" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createReview.isPending}>
                      {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loadingReviews ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : reviews?.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="You haven't left any reviews for your past services."
          action={
            eligibleAppointments.length > 0 ? (
              <Button onClick={() => setIsCreateOpen(true)} className="mt-2">
                Write a Review
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {reviews?.map(review => (
            <Card key={review.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <RatingStars rating={review.rating} />
                  <Badge variant={review.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                    {review.status}
                  </Badge>
                </div>
                {review.title && <CardTitle className="text-lg">{review.title}</CardTitle>}
                <CardDescription className="text-xs">
                  {formatDateTime(review.createdAt)}
                  {review.appointmentLabel && ` • ${review.appointmentLabel}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm">{review.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
