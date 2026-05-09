import { useMutation, useQuery } from "@tanstack/react-query";

type AuthTokenGetter = () => Promise<string | null> | string | null;

type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  isRead?: boolean;
};

type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: unknown;
};

type StaffMember = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  joinDate: string;
  isActive: boolean;
};

type Vendor = {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  partsCount?: number;
};

type PartCategory = {
  id: number;
  name: string;
};

type Part = {
  id: number;
  name: string;
  partNumber?: string;
  categoryId: number;
  categoryName: string;
  description?: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  vendorId?: number;
  vendorName?: string;
};

type PurchaseInvoice = {
  id: number;
  invoiceNumber: string;
  vendorId: number;
  vendorName: string;
  vendorPhone?: string;
  totalCost: number;
  itemsCount: number;
  createdAt: string;
  createdByName: string;
  notes?: string;
  lineItems: Array<{
    partId: number;
    partName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    stockBefore: number;
    stockAfter: number;
  }>;
};

type NotificationItem = {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

let authTokenGetter: AuthTokenGetter | null = null;
let nextStaffId = 4;
let nextVendorId = 4;
let nextPartId = 5;
let nextCategoryId = 5;
let nextInvoiceId = 3;

const staff: StaffMember[] = [
  {
    id: 1,
    fullName: "Aarav Sharma",
    email: "aarav@autoparts.local",
    role: "manager",
    phoneNumber: "9800000001",
    joinDate: "2025-07-15",
    isActive: true,
  },
  {
    id: 2,
    fullName: "Nisha Karki",
    email: "nisha@autoparts.local",
    role: "sales_staff",
    phoneNumber: "9800000002",
    joinDate: "2025-09-03",
    isActive: true,
  },
  {
    id: 3,
    fullName: "Rajan Thapa",
    email: "rajan@autoparts.local",
    role: "sales_staff",
    phoneNumber: "9800000003",
    joinDate: "2024-11-20",
    isActive: false,
  },
];

const vendors: Vendor[] = [
  {
    id: 1,
    name: "Everest Auto Supply",
    contactPerson: "Suman Rai",
    phone: "014412233",
    email: "sales@everestauto.local",
    address: "Teku, Kathmandu",
    notes: "Preferred vendor for filters and brake pads.",
  },
  {
    id: 2,
    name: "Himalayan Motors Parts",
    contactPerson: "Maya Gurung",
    phone: "015556677",
    email: "orders@himalayanparts.local",
    address: "Lalitpur Industrial Area",
  },
  {
    id: 3,
    name: "Rapid Tyre House",
    contactPerson: "Bibek Lama",
    phone: "014449999",
    email: "hello@rapidtyre.local",
    address: "Balaju, Kathmandu",
  },
];

const categories: PartCategory[] = [
  { id: 1, name: "Filters" },
  { id: 2, name: "Brakes" },
  { id: 3, name: "Lighting" },
  { id: 4, name: "Tyres" },
];

const parts: Part[] = [
  {
    id: 1,
    name: "Premium Oil Filter",
    partNumber: "OF-204",
    categoryId: 1,
    categoryName: "Filters",
    unitPrice: 18.5,
    stockQuantity: 42,
    reorderLevel: 10,
    vendorId: 1,
    vendorName: "Everest Auto Supply",
  },
  {
    id: 2,
    name: "Ceramic Brake Pads",
    partNumber: "BP-118",
    categoryId: 2,
    categoryName: "Brakes",
    unitPrice: 64.99,
    stockQuantity: 8,
    reorderLevel: 12,
    vendorId: 1,
    vendorName: "Everest Auto Supply",
  },
  {
    id: 3,
    name: "LED Headlight Pair",
    partNumber: "HL-77",
    categoryId: 3,
    categoryName: "Lighting",
    unitPrice: 95,
    stockQuantity: 0,
    reorderLevel: 5,
    vendorId: 2,
    vendorName: "Himalayan Motors Parts",
  },
  {
    id: 4,
    name: "All Weather Tyre",
    partNumber: "TY-401",
    categoryId: 4,
    categoryName: "Tyres",
    unitPrice: 129.5,
    stockQuantity: 24,
    reorderLevel: 8,
    vendorId: 3,
    vendorName: "Rapid Tyre House",
  },
];

const purchaseInvoices: PurchaseInvoice[] = [
  {
    id: 1,
    invoiceNumber: "PI-2026-0001",
    vendorId: 1,
    vendorName: "Everest Auto Supply",
    vendorPhone: "014412233",
    totalCost: 740,
    itemsCount: 2,
    createdAt: "2026-05-01T10:30:00.000Z",
    createdByName: "Aarav Sharma",
    notes: "Monthly stock refill.",
    lineItems: [
      {
        partId: 1,
        partName: "Premium Oil Filter",
        quantity: 20,
        unitCost: 12,
        subtotal: 240,
        stockBefore: 22,
        stockAfter: 42,
      },
      {
        partId: 2,
        partName: "Ceramic Brake Pads",
        quantity: 10,
        unitCost: 50,
        subtotal: 500,
        stockBefore: 0,
        stockAfter: 10,
      },
    ],
  },
  {
    id: 2,
    invoiceNumber: "PI-2026-0002",
    vendorId: 3,
    vendorName: "Rapid Tyre House",
    vendorPhone: "014449999",
    totalCost: 1942.5,
    itemsCount: 1,
    createdAt: "2026-05-05T08:15:00.000Z",
    createdByName: "Nisha Karki",
    lineItems: [
      {
        partId: 4,
        partName: "All Weather Tyre",
        quantity: 15,
        unitCost: 129.5,
        subtotal: 1942.5,
        stockBefore: 9,
        stockAfter: 24,
      },
    ],
  },
];

const notifications: NotificationItem[] = [
  {
    id: 1,
    type: "low_stock",
    message: "LED Headlight Pair is out of stock.",
    isRead: false,
    createdAt: "2026-05-08T09:00:00.000Z",
  },
  {
    id: 2,
    type: "warning",
    message: "Ceramic Brake Pads are below reorder level.",
    isRead: false,
    createdAt: "2026-05-07T15:20:00.000Z",
  },
  {
    id: 3,
    type: "success",
    message: "Purchase invoice PI-2026-0002 was recorded.",
    isRead: true,
    createdAt: "2026-05-05T08:20:00.000Z",
  },
];

let settings = {
  companyName: "AutoParts",
  companyAddress: "Kathmandu, Nepal",
  currencySymbol: "$",
  lowStockThreshold: 10,
  loyaltyDiscountThreshold: 5000,
  loyaltyDiscountPercentage: 10,
};

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

export function setBaseUrl(): void {
  // The admin portal uses local data until backend admin endpoints are added.
}

function containsSearch(value: string | undefined, search: string): boolean {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function paginate<T>(rows: T[], params: ListParams = {}, extra: Record<string, unknown> = {}): PagedResult<T> {
  const page = params.page ?? 1;
  const limit = params.limit ?? (rows.length || 1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: rows.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
    ...extra,
  };
}

function vendorName(vendorId: number | undefined): string | undefined {
  return vendors.find((vendor) => vendor.id === vendorId)?.name;
}

function refreshVendorCounts(): void {
  for (const vendor of vendors) {
    vendor.partsCount = parts.filter((part) => part.vendorId === vendor.id).length;
  }
}

function getLowStockRows(): Array<Record<string, unknown>> {
  return parts
    .filter((part) => part.stockQuantity <= part.reorderLevel)
    .map((part) => ({
      partId: part.id,
      partName: part.name,
      category: part.categoryName,
      currentStock: part.stockQuantity,
      reorderLevel: part.reorderLevel,
      vendorName: part.vendorName ?? "Unassigned",
    }));
}

export function useAdminLogin() {
  return useMutation<{ token: string }, Error, { data: { email: string; password: string } }>({
    mutationFn: async ({ data }) => {
      if (!data.email || !data.password) {
        throw new Error("Email and password are required.");
      }

      return { token: "local-admin-token" };
    },
  });
}

export function useGetDashboardSummary() {
  return useQuery<any>({
    queryKey: ["/v1/admin/dashboard"],
    queryFn: async () => ({
      totalRevenue: 148750,
      revenueChange: 12,
      totalInvoices: purchaseInvoices.length,
      invoicesChange: 8,
      totalPartsSkus: parts.length,
      lowStockAlerts: getLowStockRows().length,
      activeStaff: staff.filter((member) => member.isActive).length,
      activeVendors: vendors.length,
    }),
  });
}

export function useListStaff(params: ListParams = {}) {
  return useQuery<any>({
    queryKey: ["/v1/staff", params],
    queryFn: async () => {
      const search = params.search?.trim();
      const rows = search
        ? staff.filter(
            (member) =>
              containsSearch(member.fullName, search) ||
              containsSearch(member.email, search) ||
              containsSearch(member.phoneNumber, search),
          )
        : staff;

      return paginate(rows, params);
    },
  });
}

export function useCreateStaff() {
  return useMutation<any, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const member: StaffMember = {
        id: nextStaffId++,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        phoneNumber: data.phoneNumber,
        joinDate: data.joinDate,
        isActive: true,
      };
      staff.unshift(member);
      return member;
    },
  });
}

export function useUpdateStaff() {
  return useMutation<any, Error, { id: number; data: Record<string, any> }>({
    mutationFn: async ({ id, data }) => {
      const member = staff.find((item) => item.id === id);
      if (!member) throw new Error("Staff member not found.");
      Object.assign(member, data);
      return member;
    },
  });
}

export function useDeleteStaff() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const index = staff.findIndex((item) => item.id === id);
      if (index >= 0) staff.splice(index, 1);
    },
  });
}

export function useListVendors(params: ListParams = {}) {
  return useQuery<any>({
    queryKey: ["/v1/vendors", params],
    queryFn: async () => {
      refreshVendorCounts();
      const search = params.search?.trim();
      const rows = search
        ? vendors.filter(
            (vendor) =>
              containsSearch(vendor.name, search) ||
              containsSearch(vendor.contactPerson, search) ||
              containsSearch(vendor.email, search) ||
              containsSearch(vendor.phone, search),
          )
        : vendors;

      return paginate(rows, params);
    },
  });
}

export function useGetVendor({ id }: { id: number }) {
  return useQuery<any>({
    queryKey: ["/v1/vendors", id],
    queryFn: async () => {
      const vendor = vendors.find((item) => item.id === id);
      if (!vendor) return null;
      const vendorParts = parts.filter((part) => part.vendorId === id);
      const invoices = purchaseInvoices.filter((invoice) => invoice.vendorId === id);

      return {
        ...vendor,
        parts: vendorParts,
        partsSuppliedCount: vendorParts.length,
        purchaseInvoices: invoices,
        totalPurchaseValue: invoices.reduce((sum, invoice) => sum + invoice.totalCost, 0),
      };
    },
  });
}

export function useCreateVendor() {
  return useMutation<any, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const vendor: Vendor = { id: nextVendorId++, name: data.name, ...data };
      vendors.unshift(vendor);
      return vendor;
    },
  });
}

export function useUpdateVendor() {
  return useMutation<any, Error, { id: number; data: Record<string, any> }>({
    mutationFn: async ({ id, data }) => {
      const vendor = vendors.find((item) => item.id === id);
      if (!vendor) throw new Error("Vendor not found.");
      Object.assign(vendor, data);
      return vendor;
    },
  });
}

export function useDeleteVendor() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const index = vendors.findIndex((item) => item.id === id);
      if (index >= 0) vendors.splice(index, 1);
    },
  });
}

export function useListPartCategories() {
  return useQuery<any>({
    queryKey: ["/v1/parts/categories"],
    queryFn: async () => categories,
  });
}

export function useCreatePartCategory() {
  return useMutation<any, Error, { data: { name: string } }>({
    mutationFn: async ({ data }) => {
      const category = { id: nextCategoryId++, name: data.name };
      categories.push(category);
      return category;
    },
  });
}

export function useListParts(params: ListParams = {}) {
  return useQuery<any>({
    queryKey: ["/v1/parts", params],
    queryFn: async () => {
      const search = params.search?.trim();
      let rows = search
        ? parts.filter(
            (part) =>
              containsSearch(part.name, search) ||
              containsSearch(part.partNumber, search) ||
              containsSearch(part.categoryName, search),
          )
        : [...parts];

      if (params.categoryId) {
        rows = rows.filter((part) => part.categoryId === params.categoryId);
      }

      if (params.stockStatus === "in_stock") {
        rows = rows.filter((part) => part.stockQuantity > part.reorderLevel);
      } else if (params.stockStatus === "low_stock") {
        rows = rows.filter((part) => part.stockQuantity > 0 && part.stockQuantity <= part.reorderLevel);
      } else if (params.stockStatus === "out_of_stock") {
        rows = rows.filter((part) => part.stockQuantity === 0);
      }

      return paginate(rows, params, {
        lowStockCount: getLowStockRows().length,
      });
    },
  });
}

export function useGetLowStockParts() {
  return useQuery<any>({
    queryKey: ["/v1/parts/low-stock"],
    queryFn: async () => getLowStockRows(),
  });
}

export function useCreatePart() {
  return useMutation<any, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const category = categories.find((item) => item.id === data.categoryId);
      const part: Part = {
        id: nextPartId++,
        name: data.name,
        partNumber: data.partNumber,
        categoryId: data.categoryId,
        categoryName: category?.name ?? "Uncategorized",
        description: data.description,
        unitPrice: Number(data.unitPrice),
        stockQuantity: Number(data.stockQuantity ?? 0),
        reorderLevel: Number(data.reorderLevel ?? 0),
        vendorId: data.vendorId,
        vendorName: vendorName(data.vendorId),
      };
      parts.unshift(part);
      return part;
    },
  });
}

export function useUpdatePart() {
  return useMutation<any, Error, { id: number; data: Record<string, any> }>({
    mutationFn: async ({ id, data }) => {
      const part = parts.find((item) => item.id === id);
      if (!part) throw new Error("Part not found.");
      const category = categories.find((item) => item.id === data.categoryId);
      Object.assign(part, {
        ...data,
        categoryName: category?.name ?? part.categoryName,
        vendorName: vendorName(data.vendorId),
      });
      return part;
    },
  });
}

export function useDeletePart() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const index = parts.findIndex((item) => item.id === id);
      if (index >= 0) parts.splice(index, 1);
    },
  });
}

export function useListPurchaseInvoices(params: ListParams = {}) {
  return useQuery<any>({
    queryKey: ["/v1/purchase-invoices", params],
    queryFn: async () => {
      const search = params.search?.trim();
      const rows = search
        ? purchaseInvoices.filter(
            (invoice) =>
              containsSearch(invoice.invoiceNumber, search) ||
              containsSearch(invoice.vendorName, search),
          )
        : purchaseInvoices;

      return paginate(rows, params, {
        totalValue: rows.reduce((sum, invoice) => sum + invoice.totalCost, 0),
      });
    },
  });
}

export function useGetPurchaseInvoice({ id }: { id: number }) {
  return useQuery<any>({
    queryKey: ["/v1/purchase-invoices", id],
    queryFn: async () => purchaseInvoices.find((invoice) => invoice.id === id) ?? null,
  });
}

export function useCreatePurchaseInvoice() {
  return useMutation<any, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const vendor = vendors.find((item) => item.id === data.vendorId);
      const lineItems = (data.lineItems as Array<{ partId: number; quantity: number; unitCost: number }>).map(
        (item) => {
          const part = parts.find((row) => row.id === item.partId);
          const stockBefore = part?.stockQuantity ?? 0;
          const stockAfter = stockBefore + item.quantity;
          if (part) part.stockQuantity = stockAfter;

          return {
            partId: item.partId,
            partName: part?.name ?? "Unknown part",
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
            stockBefore,
            stockAfter,
          };
        },
      );
      const totalCost = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
      const invoice: PurchaseInvoice = {
        id: nextInvoiceId++,
        invoiceNumber: `PI-2026-${String(nextInvoiceId).padStart(4, "0")}`,
        vendorId: data.vendorId,
        vendorName: vendor?.name ?? "Unknown vendor",
        vendorPhone: vendor?.phone,
        totalCost,
        itemsCount: lineItems.length,
        createdAt: new Date().toISOString(),
        createdByName: "Local Admin",
        notes: data.notes,
        lineItems,
      };
      purchaseInvoices.unshift(invoice);
      return invoice;
    },
  });
}

export function useGetFinancialReport(params: { period: string; date: string }) {
  return useQuery<any>({
    queryKey: ["/v1/reports/financial", params],
    queryFn: async () => {
      const chartData = Array.from({ length: params.period === "monthly" ? 6 : 12 }, (_, index) => ({
        date: params.period === "monthly" ? `Week ${index + 1}` : `M${index + 1}`,
        revenue: 9000 + index * 1400,
        invoiceCount: 8 + index,
      }));

      return {
        summary: {
          totalRevenue: chartData.reduce((sum, row) => sum + row.revenue, 0),
          totalInvoices: chartData.reduce((sum, row) => sum + row.invoiceCount, 0),
          averageInvoiceValue: 825.5,
          netCashReceived: 64750,
        },
        chartData,
        topParts: parts.map((part, index) => ({
          partId: part.id,
          partName: part.name,
          totalSold: 35 - index * 4,
          totalRevenue: part.unitPrice * (35 - index * 4),
        })),
        tableRows: chartData,
      };
    },
  });
}

export function useListNotifications(params: ListParams = {}) {
  return useQuery<any>({
    queryKey: ["/v1/notifications", params],
    queryFn: async () => {
      const rows =
        typeof params.isRead === "boolean"
          ? notifications.filter((notification) => notification.isRead === params.isRead)
          : notifications;

      return paginate(rows, params, {
        unreadCount: notifications.filter((notification) => !notification.isRead).length,
      });
    },
  });
}

export function useMarkNotificationRead() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const notification = notifications.find((item) => item.id === id);
      if (notification) notification.isRead = true;
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      for (const notification of notifications) {
        notification.isRead = true;
      }
    },
  });
}

export function useGetSettings() {
  return useQuery<any>({
    queryKey: ["/v1/settings"],
    queryFn: async () => settings,
  });
}

export function useUpdateSettings() {
  return useMutation<any, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      settings = { ...settings, ...data };
      return settings;
    },
  });
}

void authTokenGetter;
