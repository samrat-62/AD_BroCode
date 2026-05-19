import { useMutation, useQuery } from "@tanstack/react-query";

type QueryOptions = {
  query?: {
    enabled?: boolean;
  };
};

type Id = string;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type InvoiceStatus = "paid" | "credit" | "partial";
type PaymentMethod = "cash" | "card" | "credit";
type CustomerOrderStatus = "pending" | "processing" | "delivered" | "cancelled";
type CustomerOrderPaymentMethod = PaymentMethod | "cash_on_delivery";

type CustomerListParams = {
  search?: string;
  hasCredit?: boolean;
  regular?: boolean;
};

type SearchCustomerParams = {
  mode?: "name" | "phone" | "id" | "plate";
  q?: string;
};

type InvoiceListParams = {
  search?: string;
  status?: InvoiceStatus;
};

type PartListParams = {
  search?: string;
};

export type Staff = {
  id: Id;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export type StaffSession = {
  token: string;
  sessionId: Id;
  staff: Staff;
};

export type Customer = {
  id: Id;
  fullName: string;
  phone: string;
  email?: string | null;
  nid?: string | null;
  dob?: string | null;
  address?: string | null;
  creditLimit: number;
  creditBalance: number;
  totalSpend: number;
  vehiclesCount: number;
  visitCount: number;
  lastVisit?: string | null;
  memberSince: string;
  regular: boolean;
};

export type Vehicle = {
  id: Id;
  customerId: Id;
  make: string;
  model: string;
  year: number;
  plate: string;
  color?: string | null;
  fuelType?: string | null;
  engineCc?: number | null;
};

export type Part = {
  id: Id;
  partNumber: string;
  name: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
};

export type Invoice = {
  id: Id;
  invoiceNumber: string;
  customerId?: Id | null;
  walkInName?: string | null;
  vehicleId?: Id | null;
  staffName: string;
  createdAt: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
};

export type InvoiceSummary = Invoice & {
  customerName: string;
  vehiclePlate?: string | null;
};

export type CustomerOrder = {
  id: Id;
  orderNumber: string;
  customerId: Id;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: CustomerOrderStatus;
  deliveryType: "pickup" | "delivery";
  paymentMethod: CustomerOrderPaymentMethod;
  deliveryAddress?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: Id;
    partId: Id;
    partName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

export type CustomerPurchase = {
  id: Id;
  source: "invoice" | "order";
  referenceNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  staffName?: string | null;
  vehiclePlate?: string | null;
};

export type InvoiceItem = {
  id: Id;
  partId: Id;
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CustomerNote = {
  id: Id;
  customerId: Id;
  body: string;
  author: string;
  createdAt: string;
};

export type NotificationItem = {
  id: Id;
  type: "low_stock" | "overdue_credit" | "appointment" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string | null;
};

export type CreditTransaction = {
  id: Id;
  customerId: Id;
  date: string;
  type: "charge" | "payment";
  notes?: string | null;
  invoiceId?: Id | null;
  amount: number;
  balanceAfter: number;
};

export type DashboardStats = {
  salesToday: number;
  invoicesToday: number;
  newCustomersToday: number;
  pendingCreditTotal: number;
};

export type CustomerProfileResult = {
  customer: Customer;
  totalSpend: number;
  memberSince: string;
};

export type InvoiceDetail = {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer | null;
  vehicle: Vehicle | null;
  staffName: string;
  notes?: string | null;
};

export type PendingCreditReportRow = {
  customerId: Id;
  fullName: string;
  phone: string;
  email?: string | null;
  creditAmount: number;
  daysOverdue: number;
  lastPaymentDate?: string | null;
};

export type RegularCustomerReportRow = {
  customerId: Id;
  fullName: string;
  phone: string;
  visitCount: number;
  totalSpend: number;
  lastVisit: string;
};

export type HighSpenderReportRow = {
  customerId: Id;
  fullName: string;
  totalSpend: number;
  avgPerVisit: number;
  visitCount: number;
};

export type SalesSummaryReport = {
  totalSales: number;
  totalInvoices: number;
  avgSaleValue: number;
  paidSales: number;
  dailySales: Array<{
    date: string;
    total: number;
    invoices: number;
  }>;
  topParts: Array<{
    partId: Id;
    partNumber: string;
    name: string;
    revenue: number;
    quantitySold: number;
  }>;
};

export type ServiceRecord = {
  id: Id;
  customerId: Id;
  date: string;
  serviceType: string;
  technician: string;
  cost: number;
};

type ApiError = Error & {
  status?: number;
  data?: unknown;
};

let apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5217/api");

export function setBaseUrl(url?: string | null): void {
  apiBaseUrl = normalizeBaseUrl(url ?? "http://localhost:5217/api");
}

export function setAuthTokenGetter(): void {
  // The staff portal stores auth in Zustand persist. The API client reads it directly.
}

export function getListCustomersQueryKey() {
  return ["staff", "customers"] as const;
}

export function getGetCustomerNotesQueryKey(id: string) {
  return ["staff", "customers", id, "notes"] as const;
}

export function getGetInvoiceQueryKey(id: string) {
  return ["staff", "invoices", id] as const;
}

export function getGetRecentSalesQueryKey() {
  return ["staff", "dashboard", "recent-sales"] as const;
}

export function getListCustomerOrdersQueryKey() {
  return ["staff", "orders"] as const;
}

export function getListNotificationsQueryKey() {
  return ["staff", "notifications"] as const;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildUrl(path: string, params?: QueryParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = apiBaseUrl.startsWith("http")
    ? apiBaseUrl
    : `${window.location.origin}${apiBaseUrl.startsWith("/") ? apiBaseUrl : `/${apiBaseUrl}`}`;
  const url = new URL(`${base}${cleanPath}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function getStoredStaffToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("staff_auth");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

function clearStaffAuthAndRedirect(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("staff_auth");
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? JSON.parse(text) : text;
}

function getErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.title === "string") return record.title;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return `Request failed with status ${status}.`;
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: QueryParams;
    auth?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getStoredStaffToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const data = await readResponse(response);

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      clearStaffAuthAndRedirect();
    }

    const error = new Error(getErrorMessage(data, response.status)) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

const get = <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
  apiRequest<T>(path, { params, signal });

const post = <T>(path: string, body?: unknown, auth = true) =>
  apiRequest<T>(path, { method: "POST", body, auth });

export function useStaffLogin() {
  return useMutation<StaffSession, ApiError, { data: { email: string; password: string } }>({
    mutationFn: ({ data }) => post<StaffSession>("/staff/auth/login", data, false),
  });
}

export function useGetDashboardStats() {
  return useQuery<DashboardStats, ApiError>({
    queryKey: ["staff", "dashboard", "stats"],
    queryFn: ({ signal }) => get<DashboardStats>("/staff/dashboard/stats", undefined, signal),
  });
}

export function useGetRecentSales(params: { limit?: number } = {}) {
  return useQuery<InvoiceSummary[], ApiError>({
    queryKey: [...getGetRecentSalesQueryKey(), params],
    queryFn: ({ signal }) => get<InvoiceSummary[]>("/staff/dashboard/recent-sales", params, signal),
  });
}

export function useGetDashboardAlerts() {
  return useQuery<{ lowStock: Part[]; overdueCredits: PendingCreditReportRow[] }, ApiError>({
    queryKey: ["staff", "dashboard", "alerts"],
    queryFn: ({ signal }) => get<{ lowStock: Part[]; overdueCredits: PendingCreditReportRow[] }>("/staff/dashboard/alerts", undefined, signal),
  });
}

export function useListCustomers(params: CustomerListParams = {}) {
  return useQuery<Customer[], ApiError>({
    queryKey: [...getListCustomersQueryKey(), params],
    queryFn: ({ signal }) => get<Customer[]>("/staff/customers", params, signal),
  });
}

export function useSearchCustomers(params: SearchCustomerParams = {}, options: QueryOptions = {}) {
  return useQuery<Customer[], ApiError>({
    queryKey: ["staff", "customers", "search", params],
    enabled: options.query?.enabled ?? true,
    queryFn: ({ signal }) => get<Customer[]>("/staff/customers/search", params, signal),
  });
}

export function useCreateCustomer() {
  return useMutation<Customer, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<Customer>("/staff/customers", data),
  });
}

export function useGetCustomer(id: string, options: QueryOptions = {}) {
  return useQuery<CustomerProfileResult | null, ApiError>({
    queryKey: ["staff", "customers", id],
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<CustomerProfileResult>(`/staff/customers/${id}`, undefined, signal),
  });
}

export function useGetCustomerVehicles(id: string, options: QueryOptions = {}) {
  return useQuery<Vehicle[], ApiError>({
    queryKey: ["staff", "customers", id, "vehicles"],
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<Vehicle[]>(`/staff/customers/${id}/vehicles`, undefined, signal),
  });
}

export function useGetCustomerPurchases(id: string, options: QueryOptions = {}) {
  return useQuery<CustomerPurchase[], ApiError>({
    queryKey: ["staff", "customers", id, "purchases"],
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<CustomerPurchase[]>(`/staff/customers/${id}/purchases`, undefined, signal),
  });
}

export function useGetCustomerServices(id: string, options: QueryOptions = {}) {
  return useQuery<ServiceRecord[], ApiError>({
    queryKey: ["staff", "customers", id, "services"],
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<ServiceRecord[]>(`/staff/customers/${id}/services`, undefined, signal),
  });
}

export function useGetCustomerCredit(id: string, options: QueryOptions = {}) {
  return useQuery<{ transactions: CreditTransaction[] }, ApiError>({
    queryKey: ["staff", "customers", id, "credit"],
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<{ transactions: CreditTransaction[] }>(`/staff/customers/${id}/credit`, undefined, signal),
  });
}

export function useGetCustomerNotes(id: string, options: QueryOptions = {}) {
  return useQuery<CustomerNote[], ApiError>({
    queryKey: getGetCustomerNotesQueryKey(id),
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<CustomerNote[]>(`/staff/customers/${id}/notes`, undefined, signal),
  });
}

export function useAddCustomerNote() {
  return useMutation<CustomerNote, ApiError, { id: string; data: { body: string } }>({
    mutationFn: ({ id, data }) => post<CustomerNote>(`/staff/customers/${id}/notes`, data),
  });
}

export function useListInvoices(params: InvoiceListParams = {}) {
  return useQuery<InvoiceSummary[], ApiError>({
    queryKey: ["staff", "invoices", params],
    queryFn: ({ signal }) => get<InvoiceSummary[]>("/staff/invoices", params, signal),
  });
}

export function useListCustomerOrders(params: { status?: CustomerOrderStatus | "all" } = {}) {
  return useQuery<CustomerOrder[], ApiError>({
    queryKey: [...getListCustomerOrdersQueryKey(), params],
    queryFn: ({ signal }) => get<CustomerOrder[]>("/staff/orders", params, signal),
  });
}

export function useUpdateCustomerOrderStatus() {
  return useMutation<CustomerOrder, ApiError, { id: string; data: { status: CustomerOrderStatus } }>({
    mutationFn: ({ id, data }) => apiRequest<CustomerOrder>(`/staff/orders/${id}/status`, {
      method: "PUT",
      body: data,
    }),
  });
}

export function useGetInvoice(id: string, options: QueryOptions = {}) {
  return useQuery<InvoiceDetail | null, ApiError>({
    queryKey: getGetInvoiceQueryKey(id),
    enabled: (options.query?.enabled ?? true) && Boolean(id),
    queryFn: ({ signal }) => get<InvoiceDetail>(`/staff/invoices/${id}`, undefined, signal),
  });
}

export function useMarkInvoicePaid() {
  return useMutation<Invoice, ApiError, { id: string }>({
    mutationFn: ({ id }) => post<Invoice>(`/staff/invoices/${id}/mark-paid`),
  });
}

export function useSendInvoiceEmail() {
  return useMutation<{ id: string; sentTo: unknown; sentAt: string }, ApiError, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => post<{ id: string; sentTo: unknown; sentAt: string }>(`/staff/invoices/${id}/email`, data),
  });
}

export function useListNotifications() {
  return useQuery<NotificationItem[], ApiError>({
    queryKey: getListNotificationsQueryKey(),
    queryFn: ({ signal }) => get<NotificationItem[]>("/staff/notifications", undefined, signal),
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => post<void>("/staff/notifications/read-all"),
  });
}

export function useGetLowStockParts() {
  return useQuery<Part[], ApiError>({
    queryKey: ["staff", "parts", "low-stock"],
    queryFn: ({ signal }) => get<Part[]>("/staff/parts/low-stock", undefined, signal),
  });
}

export function useListParts(params: PartListParams = {}) {
  return useQuery<Part[], ApiError>({
    queryKey: ["staff", "parts", params],
    queryFn: ({ signal }) => get<Part[]>("/staff/parts", params, signal),
  });
}

export function useCreateSale() {
  return useMutation<InvoiceDetail, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<InvoiceDetail>("/staff/sales", data),
  });
}

export function useGetRegularCustomersReport(params: { minVisits?: number } = {}) {
  return useQuery<RegularCustomerReportRow[], ApiError>({
    queryKey: ["staff", "reports", "regular-customers", params],
    queryFn: ({ signal }) => get<RegularCustomerReportRow[]>("/staff/reports/regular-customers", params, signal),
  });
}

export function useGetHighSpendersReport(params: { limit?: number } = {}) {
  return useQuery<HighSpenderReportRow[], ApiError>({
    queryKey: ["staff", "reports", "high-spenders", params],
    queryFn: ({ signal }) => get<HighSpenderReportRow[]>("/staff/reports/high-spenders", params, signal),
  });
}

export function useGetPendingCreditsReport() {
  return useQuery<PendingCreditReportRow[], ApiError>({
    queryKey: ["staff", "reports", "pending-credits"],
    queryFn: ({ signal }) => get<PendingCreditReportRow[]>("/staff/reports/pending-credits", undefined, signal),
  });
}

export function useGetSalesSummaryReport() {
  return useQuery<SalesSummaryReport, ApiError>({
    queryKey: ["staff", "reports", "sales-summary"],
    queryFn: ({ signal }) => get<SalesSummaryReport>("/staff/reports/sales-summary", undefined, signal),
  });
}

export function useSendCreditReminder() {
  return useMutation<{ sentTo: unknown; sentAt: string }, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<{ sentTo: unknown; sentAt: string }>("/staff/reports/credit-reminders", data),
  });
}
