import { useMutation, useQuery } from "@tanstack/react-query";

export type AuthTokenGetter = () => Promise<string | null> | string | null;

type Id = string;

type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: Id;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  isRead?: boolean;
};

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: unknown;
};

type AuthResponse = {
  id: Id;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  sessionId: Id;
  token: string;
  expiresAtUtc: string;
};

type DashboardSummary = {
  totalRevenue: number;
  revenueChange: number;
  totalInvoices: number;
  invoicesChange: number;
  totalPartsSkus: number;
  lowStockAlerts: number;
  activeStaff: number;
  activeVendors: number;
};

type StaffMember = {
  id: Id;
  userId: Id;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string | null;
  joinDate: string;
  isActive: boolean;
};

type Vendor = {
  id: Id;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  partsCount?: number;
};

type VendorDetail = Vendor & {
  partsSuppliedCount: number;
  totalPurchaseValue: number;
  parts: Array<{
    id: Id;
    name: string;
    partNumber?: string | null;
    stockQuantity: number;
    reorderLevel: number;
    unitPrice: number;
  }>;
  purchaseInvoices: Array<{
    id: Id;
    invoiceNumber: string;
    totalCost: number;
    createdAt: string;
  }>;
};

type PartCategory = {
  id: Id;
  name: string;
};

type Part = {
  id: Id;
  name: string;
  partNumber?: string | null;
  categoryId: Id;
  categoryName: string;
  description?: string | null;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  vendorId?: Id | null;
  vendorName?: string | null;
};

type LowStockPart = {
  partId: Id;
  partName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  vendorName?: string | null;
};

type AdminPartRequest = {
  id: Id;
  customerId: Id;
  customerName: string;
  customerEmail: string;
  phone: string;
  vehicleId?: Id | null;
  vehicleLabel?: string | null;
  partName: string;
  partNumber?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status: "pending" | "acknowledged" | "found" | "unavailable";
  createdAt: string;
  updatedAt: string;
};

type PartListResult = PagedResult<Part> & {
  lowStockCount: number;
};

type PurchaseInvoice = {
  id: Id;
  invoiceNumber: string;
  vendorId: Id;
  vendorName: string;
  vendorPhone?: string | null;
  totalCost: number;
  itemsCount: number;
  createdAt: string;
  createdByName?: string | null;
  notes?: string | null;
  lineItems: Array<{
    partId: Id;
    partName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    stockBefore: number;
    stockAfter: number;
  }>;
};

type NotificationItem = {
  id: Id;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type FinancialReport = {
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    averageInvoiceValue: number;
    netCashReceived: number;
  };
  chartData: Array<{
    date: string;
    revenue: number;
    invoiceCount: number;
  }>;
  topParts: Array<{
    partId: Id;
    partName: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  tableRows: Array<{
    date: string;
    revenue: number;
    invoiceCount: number;
  }>;
};

type AdminSettings = {
  companyName: string;
  companyAddress?: string | null;
  currencySymbol: string;
  lowStockThreshold: number;
  loyaltyDiscountThreshold: number;
  loyaltyDiscountPercentage: number;
};

type ApiError = Error & {
  status?: number;
  data?: unknown;
};

let authTokenGetter: AuthTokenGetter | null = null;
let apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5217/api");

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

export function setBaseUrl(url?: string | null): void {
  apiBaseUrl = normalizeBaseUrl(url ?? "http://localhost:5217/api");
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

async function getAuthToken(): Promise<string | null> {
  return authTokenGetter ? await authTokenGetter() : null;
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
  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
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

function redirectToLoginAfterUnauthorized(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("admin_token");

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const loginPath = `${basePath}/admin/login`;

  if (window.location.pathname !== loginPath) {
    window.location.assign(loginPath);
  }
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
  const hasBody = options.body !== undefined;

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const data = await readResponse(response);

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      redirectToLoginAfterUnauthorized();
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

const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body });

const put = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PUT", body });

const del = (path: string) =>
  apiRequest<void>(path, { method: "DELETE" });

export function useAdminLogin() {
  return useMutation<AuthResponse, ApiError, { data: { email: string; password: string } }>({
    mutationFn: ({ data }) => apiRequest<AuthResponse>("/admin/auth/login", {
      method: "POST",
      body: data,
      auth: false,
    }),
  });
}

export function useGetDashboardSummary() {
  return useQuery<DashboardSummary, ApiError>({
    queryKey: ["/v1/admin/dashboard"],
    queryFn: ({ signal }) => get<DashboardSummary>("/admin/dashboard", undefined, signal),
  });
}

export function useListStaff(params: ListParams = {}) {
  return useQuery<PagedResult<StaffMember>, ApiError>({
    queryKey: ["/v1/staff", params],
    queryFn: ({ signal }) => get<PagedResult<StaffMember>>("/admin/staff", params, signal),
  });
}

export function useCreateStaff() {
  return useMutation<StaffMember, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<StaffMember>("/admin/staff", data),
  });
}

export function useUpdateStaff() {
  return useMutation<StaffMember, ApiError, { id: Id; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => put<StaffMember>(`/admin/staff/${id}`, data),
  });
}

export function useDeleteStaff() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => del(`/admin/staff/${id}`),
  });
}

export function useListVendors(params: ListParams = {}) {
  return useQuery<PagedResult<Vendor>, ApiError>({
    queryKey: ["/v1/vendors", params],
    queryFn: ({ signal }) => get<PagedResult<Vendor>>("/admin/vendors", params, signal),
  });
}

export function useGetVendor({ id }: { id: Id }) {
  return useQuery<VendorDetail | null, ApiError>({
    queryKey: ["/v1/vendors", id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => get<VendorDetail>(`/admin/vendors/${id}`, undefined, signal),
  });
}

export function useCreateVendor() {
  return useMutation<Vendor, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<Vendor>("/admin/vendors", data),
  });
}

export function useUpdateVendor() {
  return useMutation<Vendor, ApiError, { id: Id; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => put<Vendor>(`/admin/vendors/${id}`, data),
  });
}

export function useDeleteVendor() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => del(`/admin/vendors/${id}`),
  });
}

export function useListPartCategories() {
  return useQuery<PartCategory[], ApiError>({
    queryKey: ["/v1/parts/categories"],
    queryFn: ({ signal }) => get<PartCategory[]>("/admin/parts/categories", undefined, signal),
  });
}

export function useCreatePartCategory() {
  return useMutation<PartCategory, ApiError, { data: { name: string } }>({
    mutationFn: ({ data }) => post<PartCategory>("/admin/parts/categories", data),
  });
}

export function useDeletePartCategory() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => del(`/admin/parts/categories/${id}`),
  });
}

export function useListParts(params: ListParams = {}) {
  return useQuery<PartListResult, ApiError>({
    queryKey: ["/v1/parts", params],
    queryFn: ({ signal }) => get<PartListResult>("/admin/parts", params, signal),
  });
}

export function useGetLowStockParts() {
  return useQuery<LowStockPart[], ApiError>({
    queryKey: ["/v1/parts/low-stock"],
    queryFn: ({ signal }) => get<LowStockPart[]>("/admin/parts/low-stock", undefined, signal),
  });
}

export function useCreatePart() {
  return useMutation<Part, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<Part>("/admin/parts", data),
  });
}

export function useUpdatePart() {
  return useMutation<Part, ApiError, { id: Id; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => put<Part>(`/admin/parts/${id}`, data),
  });
}

export function useDeletePart() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => del(`/admin/parts/${id}`),
  });
}

export function useListPartRequests(params: ListParams & { status?: string } = {}) {
  return useQuery<PagedResult<AdminPartRequest>, ApiError>({
    queryKey: ["/v1/part-requests", params],
    queryFn: ({ signal }) => get<PagedResult<AdminPartRequest>>("/admin/part-requests", params, signal),
  });
}

export function useUpdatePartRequestStatus() {
  return useMutation<AdminPartRequest, ApiError, { id: Id; data: { status: string } }>({
    mutationFn: ({ id, data }) => put<AdminPartRequest>(`/admin/part-requests/${id}/status`, data),
  });
}

export function useListPurchaseInvoices(params: ListParams = {}) {
  return useQuery<PagedResult<PurchaseInvoice>, ApiError>({
    queryKey: ["/v1/purchase-invoices", params],
    queryFn: ({ signal }) => get<PagedResult<PurchaseInvoice>>("/admin/purchase-invoices", params, signal),
  });
}

export function useGetPurchaseInvoice({ id }: { id: Id }) {
  return useQuery<PurchaseInvoice | null, ApiError>({
    queryKey: ["/v1/purchase-invoices", id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => get<PurchaseInvoice>(`/admin/purchase-invoices/${id}`, undefined, signal),
  });
}

export function useCreatePurchaseInvoice() {
  return useMutation<PurchaseInvoice, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => post<PurchaseInvoice>("/admin/purchase-invoices", data),
  });
}

export function useDeletePurchaseInvoice() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => del(`/admin/purchase-invoices/${id}`),
  });
}

export function useGetFinancialReport(params: { period: string; date: string }) {
  return useQuery<FinancialReport, ApiError>({
    queryKey: ["/v1/reports/financial", params],
    queryFn: ({ signal }) => get<FinancialReport>("/admin/reports/financial", params, signal),
  });
}

export function useListNotifications(params: ListParams = {}) {
  return useQuery<PagedResult<NotificationItem>, ApiError>({
    queryKey: ["/v1/notifications", params],
    queryFn: ({ signal }) => get<PagedResult<NotificationItem>>("/admin/notifications", params, signal),
  });
}

export function useMarkNotificationRead() {
  return useMutation<void, ApiError, { id: Id }>({
    mutationFn: ({ id }) => post<void>(`/admin/notifications/${id}/read`),
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => post<void>("/admin/notifications/read-all"),
  });
}

export function useGetSettings() {
  return useQuery<AdminSettings, ApiError>({
    queryKey: ["/v1/settings"],
    queryFn: ({ signal }) => get<AdminSettings>("/admin/settings", undefined, signal),
  });
}

export function useUpdateSettings() {
  return useMutation<AdminSettings, ApiError, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) => put<AdminSettings>("/admin/settings", data),
  });
}
