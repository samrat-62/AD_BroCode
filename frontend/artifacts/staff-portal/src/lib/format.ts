import { format } from "date-fns";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
};

export const formatDateTime = (date: string | Date | undefined | null) => {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy h:mm a");
};
