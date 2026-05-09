import { useMutation, useQuery } from "@tanstack/react-query";

type QueryOptions = {
  query?: {
    enabled?: boolean;
  };
};

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

type InvoiceStatus = "paid" | "credit" | "partial";
type PaymentMethod = "cash" | "card" | "credit";

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export type StaffSession = {
  token: string;
  staff: Staff;
};

type Customer = {
  id: string;
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

type Vehicle = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color?: string | null;
  fuelType?: string | null;
  engineCc?: number | null;
};

type Part = {
  id: string;
  partNumber: string;
  name: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  walkInName?: string | null;
  vehicleId?: string | null;
  staffName: string;
  createdAt: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
};

type InvoiceItem = {
  id: string;
  partId: string;
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type CustomerNote = {
  id: string;
  customerId: string;
  body: string;
  author: string;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: "low_stock" | "overdue_credit" | "appointment" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

type CreditTransaction = {
  id: string;
  customerId: string;
  date: string;
  type: "charge" | "payment";
  notes?: string | null;
  invoiceId?: string | null;
  amount: number;
  balanceAfter: number;
};

type DashboardStats = {
  salesToday: number;
  invoicesToday: number;
  newCustomersToday: number;
  pendingCreditTotal: number;
};

type InvoiceSummary = Invoice & {
  customerName: string;
  vehiclePlate?: string;
};

type CustomerProfileResult = {
  customer: Customer;
  totalSpend: number;
  memberSince: string;
};

type InvoiceDetail = {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer | null;
  vehicle: Vehicle | null;
  staffName: string;
  notes?: string | null;
};

type PendingCreditReportRow = {
  customerId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  creditAmount: number;
  daysOverdue: number;
  lastPaymentDate?: string | null;
};

type RegularCustomerReportRow = {
  customerId: string;
  fullName: string;
  phone: string;
  visitCount: number;
  totalSpend: number;
  lastVisit: string;
};

type HighSpenderReportRow = {
  customerId: string;
  fullName: string;
  totalSpend: number;
  avgPerVisit: number;
  visitCount: number;
};

type SalesSummaryReport = {
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
    partId: string;
    partNumber: string;
    name: string;
    revenue: number;
    quantitySold: number;
  }>;
};

type ServiceRecord = {
  id: string;
  customerId: string;
  date: string;
  serviceType: string;
  technician: string;
  cost: number;
};

const staffUser: Staff = {
  id: "staff-001",
  name: "Nisha Karki",
  email: "staff@autopartspro.com",
  role: "Sales Staff",
  avatarUrl: null,
};

const customers: Customer[] = [
  {
    id: "cust-001",
    fullName: "Aarav Sharma",
    phone: "9800000001",
    email: "aarav@example.com",
    nid: "NP-442198",
    address: "Lalitpur, Nepal",
    creditLimit: 2500,
    creditBalance: 420,
    totalSpend: 8450,
    vehiclesCount: 2,
    visitCount: 8,
    lastVisit: "2026-05-09T09:25:00.000Z",
    memberSince: "2025-06-15T00:00:00.000Z",
    regular: true,
  },
  {
    id: "cust-002",
    fullName: "Maya Gurung",
    phone: "9800000002",
    email: "maya@example.com",
    nid: "NP-882110",
    address: "Kathmandu, Nepal",
    creditLimit: 1500,
    creditBalance: 0,
    totalSpend: 5120,
    vehiclesCount: 1,
    visitCount: 5,
    lastVisit: "2026-05-08T13:10:00.000Z",
    memberSince: "2025-09-03T00:00:00.000Z",
    regular: true,
  },
  {
    id: "cust-003",
    fullName: "Rajan Thapa",
    phone: "9800000003",
    email: "rajan@example.com",
    nid: "NP-173622",
    address: "Bhaktapur, Nepal",
    creditLimit: 1000,
    creditBalance: 875,
    totalSpend: 2380,
    vehiclesCount: 1,
    visitCount: 3,
    lastVisit: "2026-04-28T16:40:00.000Z",
    memberSince: "2026-01-12T00:00:00.000Z",
    regular: true,
  },
  {
    id: "cust-004",
    fullName: "Suman Rai",
    phone: "9800000004",
    email: null,
    nid: "NP-901774",
    address: "Patan, Nepal",
    creditLimit: 0,
    creditBalance: 0,
    totalSpend: 720,
    vehiclesCount: 1,
    visitCount: 1,
    lastVisit: "2026-05-07T11:20:00.000Z",
    memberSince: "2026-05-07T00:00:00.000Z",
    regular: false,
  },
];

const vehicles: Vehicle[] = [
  {
    id: "veh-001",
    customerId: "cust-001",
    make: "Toyota",
    model: "Corolla",
    year: 2019,
    plate: "BA-18-PA-4421",
    color: "Silver",
    fuelType: "Petrol",
    engineCc: 1800,
  },
  {
    id: "veh-002",
    customerId: "cust-001",
    make: "Honda",
    model: "Dio",
    year: 2021,
    plate: "BA-77-PA-2198",
    color: "Red",
    fuelType: "Petrol",
    engineCc: 110,
  },
  {
    id: "veh-003",
    customerId: "cust-002",
    make: "Hyundai",
    model: "Creta",
    year: 2020,
    plate: "BA-21-CHA-8810",
    color: "White",
    fuelType: "Diesel",
    engineCc: 1500,
  },
  {
    id: "veh-004",
    customerId: "cust-003",
    make: "Suzuki",
    model: "Swift",
    year: 2018,
    plate: "BA-10-CHA-7362",
    color: "Blue",
    fuelType: "Petrol",
    engineCc: 1200,
  },
  {
    id: "veh-005",
    customerId: "cust-004",
    make: "Mahindra",
    model: "Scorpio",
    year: 2017,
    plate: "BA-06-CHA-1774",
    color: "Black",
    fuelType: "Diesel",
    engineCc: 2200,
  },
];

const parts: Part[] = [
  {
    id: "part-001",
    partNumber: "OF-204",
    name: "Premium Oil Filter",
    unitPrice: 18.5,
    stock: 42,
    reorderLevel: 10,
  },
  {
    id: "part-002",
    partNumber: "BP-118",
    name: "Ceramic Brake Pads",
    unitPrice: 64.99,
    stock: 8,
    reorderLevel: 12,
  },
  {
    id: "part-003",
    partNumber: "HL-077",
    name: "LED Headlight Pair",
    unitPrice: 95,
    stock: 0,
    reorderLevel: 5,
  },
  {
    id: "part-004",
    partNumber: "TY-401",
    name: "All Weather Tyre",
    unitPrice: 129.5,
    stock: 24,
    reorderLevel: 8,
  },
  {
    id: "part-005",
    partNumber: "SP-032",
    name: "Iridium Spark Plug",
    unitPrice: 14.75,
    stock: 64,
    reorderLevel: 20,
  },
];

let nextInvoiceNumber = 4;

const invoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-0001",
    customerId: "cust-001",
    vehicleId: "veh-001",
    staffName: "Nisha Karki",
    createdAt: "2026-05-09T09:25:00.000Z",
    status: "credit",
    paymentMethod: "credit",
    subtotal: 224.49,
    discount: 0,
    total: 224.49,
    notes: "Customer will clear balance on Friday.",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-0002",
    customerId: "cust-002",
    vehicleId: "veh-003",
    staffName: "Nisha Karki",
    createdAt: "2026-05-08T13:10:00.000Z",
    status: "paid",
    paymentMethod: "card",
    subtotal: 148,
    discount: 0,
    total: 148,
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-0003",
    customerId: "cust-003",
    vehicleId: "veh-004",
    staffName: "Aarav Sharma",
    createdAt: "2026-04-28T16:40:00.000Z",
    status: "partial",
    paymentMethod: "cash",
    subtotal: 355,
    discount: 0,
    total: 355,
    notes: "Partial cash payment received.",
  },
];

const invoiceItems = new Map<string, InvoiceItem[]>([
  [
    "inv-001",
    [
      {
        id: "item-001",
        partId: "part-002",
        partNumber: "BP-118",
        name: "Ceramic Brake Pads",
        quantity: 2,
        unitPrice: 64.99,
        subtotal: 129.98,
      },
      {
        id: "item-002",
        partId: "part-003",
        partNumber: "HL-077",
        name: "LED Headlight Pair",
        quantity: 1,
        unitPrice: 95,
        subtotal: 95,
      },
    ],
  ],
  [
    "inv-002",
    [
      {
        id: "item-003",
        partId: "part-001",
        partNumber: "OF-204",
        name: "Premium Oil Filter",
        quantity: 2,
        unitPrice: 18.5,
        subtotal: 37,
      },
      {
        id: "item-004",
        partId: "part-005",
        partNumber: "SP-032",
        name: "Iridium Spark Plug",
        quantity: 4,
        unitPrice: 14.75,
        subtotal: 59,
      },
    ],
  ],
  [
    "inv-003",
    [
      {
        id: "item-005",
        partId: "part-004",
        partNumber: "TY-401",
        name: "All Weather Tyre",
        quantity: 2,
        unitPrice: 129.5,
        subtotal: 259,
      },
    ],
  ],
]);

const notes: CustomerNote[] = [
  {
    id: "note-001",
    customerId: "cust-001",
    body: "Prefers OEM filters when available.",
    author: "Nisha Karki",
    createdAt: "2026-05-08T10:05:00.000Z",
  },
  {
    id: "note-002",
    customerId: "cust-003",
    body: "Call before ordering parts above $200.",
    author: "Aarav Sharma",
    createdAt: "2026-04-28T16:45:00.000Z",
  },
];

const services: ServiceRecord[] = [
  {
    id: "svc-001",
    customerId: "cust-001",
    date: "2026-05-02T10:00:00.000Z",
    serviceType: "Brake inspection",
    technician: "Rajan Thapa",
    cost: 35,
  },
  {
    id: "svc-002",
    customerId: "cust-002",
    date: "2026-04-20T12:30:00.000Z",
    serviceType: "Oil change",
    technician: "Nisha Karki",
    cost: 25,
  },
];

const creditTransactions: CreditTransaction[] = [
  {
    id: "credit-001",
    customerId: "cust-001",
    date: "2026-05-09T09:25:00.000Z",
    type: "charge",
    invoiceId: "inv-001",
    amount: 224.49,
    balanceAfter: 420,
  },
  {
    id: "credit-002",
    customerId: "cust-003",
    date: "2026-04-28T16:40:00.000Z",
    type: "charge",
    invoiceId: "inv-003",
    amount: 355,
    balanceAfter: 875,
  },
];

const notifications: NotificationItem[] = [
  {
    id: "notif-001",
    type: "low_stock",
    title: "Brake pads below reorder level",
    message: "Ceramic Brake Pads have 8 units left.",
    read: false,
    createdAt: "2026-05-09T08:40:00.000Z",
    link: "/sales/new",
  },
  {
    id: "notif-002",
    type: "low_stock",
    title: "Headlights out of stock",
    message: "LED Headlight Pair is currently unavailable.",
    read: false,
    createdAt: "2026-05-08T15:15:00.000Z",
    link: "/sales/new",
  },
  {
    id: "notif-003",
    type: "overdue_credit",
    title: "Customer credit overdue",
    message: "Rajan Thapa has an outstanding balance.",
    read: true,
    createdAt: "2026-05-07T09:30:00.000Z",
    link: "/reports",
  },
];

export function setBaseUrl(): void {
  // This portal uses local in-memory data until staff backend endpoints exist.
}

export function setAuthTokenGetter(): void {
  // Auth tokens are held in the staff portal store for local development.
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
  return ["staff", "recent-sales"] as const;
}

export function getListNotificationsQueryKey() {
  return ["staff", "notifications"] as const;
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function includes(value: string | number | null | undefined, search: string): boolean {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

function getCustomer(id: string | null | undefined): Customer | undefined {
  return customers.find((customer) => customer.id === id);
}

function getVehicle(id: string | null | undefined): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}

function listLowStockParts(): Part[] {
  return parts.filter((part) => part.stock <= part.reorderLevel);
}

function invoiceSummary(invoice: Invoice): InvoiceSummary {
  const customer = getCustomer(invoice.customerId);
  const vehicle = getVehicle(invoice.vehicleId);

  return {
    ...invoice,
    customerName: customer?.fullName ?? invoice.walkInName ?? "Walk-in Customer",
    vehiclePlate: vehicle?.plate,
  };
}

function customerMatchesSearch(customer: Customer, params: SearchCustomerParams): boolean {
  const search = params.q?.trim() ?? "";
  if (!search) return true;

  if (params.mode === "phone") {
    return includes(customer.phone, search);
  }

  if (params.mode === "id") {
    return includes(customer.id, search) || includes(customer.nid, search);
  }

  if (params.mode === "plate") {
    return vehicles
      .filter((vehicle) => vehicle.customerId === customer.id)
      .some((vehicle) => includes(vehicle.plate, search));
  }

  return (
    includes(customer.fullName, search) ||
    includes(customer.phone, search) ||
    includes(customer.email, search) ||
    includes(customer.id, search)
  );
}

function sameLocalDate(value: string, date = new Date()): boolean {
  return new Date(value).toDateString() === date.toDateString();
}

function getPendingCreditsReportRows(): PendingCreditReportRow[] {
  return customers
    .filter((customer) => customer.creditBalance > 0)
    .map((customer) => ({
      customerId: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      creditAmount: customer.creditBalance,
      daysOverdue: customer.id === "cust-003" ? 42 : 12,
      lastPaymentDate: customer.id === "cust-003" ? null : "2026-04-29T10:20:00.000Z",
    }))
    .sort((left, right) => right.daysOverdue - left.daysOverdue);
}

function getSalesSummaryData(): SalesSummaryReport {
  const paidInvoices = invoices.filter((invoice) => invoice.status !== "credit");
  const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalInvoices = invoices.length;
  const dayTotals = new Map<string, { date: string; total: number; invoices: number }>();

  for (const invoice of invoices) {
    const date = invoice.createdAt.slice(0, 10);
    const current = dayTotals.get(date) ?? { date, total: 0, invoices: 0 };
    current.total += invoice.total;
    current.invoices += 1;
    dayTotals.set(date, current);
  }

  const partTotals = new Map<string, { partId: string; partNumber: string; name: string; revenue: number; quantitySold: number }>();
  for (const items of invoiceItems.values()) {
    for (const item of items) {
      const current =
        partTotals.get(item.partId) ??
        {
          partId: item.partId,
          partNumber: item.partNumber,
          name: item.name,
          revenue: 0,
          quantitySold: 0,
        };
      current.revenue += item.subtotal;
      current.quantitySold += item.quantity;
      partTotals.set(item.partId, current);
    }
  }

  return {
    totalSales,
    totalInvoices,
    avgSaleValue: totalInvoices ? totalSales / totalInvoices : 0,
    paidSales: paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    dailySales: Array.from(dayTotals.values()).sort((left, right) => left.date.localeCompare(right.date)),
    topParts: Array.from(partTotals.values()).sort((left, right) => right.revenue - left.revenue).slice(0, 5),
  };
}

export function useStaffLogin() {
  return useMutation<StaffSession, Error, { data: { email: string; password: string } }>({
    mutationFn: async ({ data }) => {
      if (!data.email || !data.password) {
        throw new Error("Email and password are required.");
      }

      return {
        token: "local-staff-token",
        staff: {
          ...staffUser,
          email: data.email,
        },
      };
    },
  });
}

export function useGetDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["staff", "dashboard", "stats"],
    queryFn: async () => {
      const todaysInvoices = invoices.filter((invoice) => sameLocalDate(invoice.createdAt));

      return {
        salesToday: todaysInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
        invoicesToday: todaysInvoices.length,
        newCustomersToday: customers.filter((customer) => sameLocalDate(customer.memberSince)).length,
        pendingCreditTotal: customers.reduce((sum, customer) => sum + customer.creditBalance, 0),
      };
    },
  });
}

export function useGetRecentSales(params: { limit?: number } = {}) {
  return useQuery<InvoiceSummary[]>({
    queryKey: [...getGetRecentSalesQueryKey(), params],
    queryFn: async () =>
      invoices
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, params.limit ?? 10)
        .map(invoiceSummary),
  });
}

export function useGetDashboardAlerts() {
  return useQuery<{ lowStock: Part[]; overdueCredits: PendingCreditReportRow[] }>({
    queryKey: ["staff", "dashboard", "alerts"],
    queryFn: async () => ({
      lowStock: listLowStockParts(),
      overdueCredits: getPendingCreditsReportRows(),
    }),
  });
}

export function useListCustomers(params: CustomerListParams = {}) {
  return useQuery<Customer[]>({
    queryKey: [...getListCustomersQueryKey(), params],
    queryFn: async () => {
      const search = params.search?.trim() ?? "";
      return customers.filter((customer) => {
        if (params.hasCredit && customer.creditBalance <= 0) return false;
        if (params.regular && !customer.regular) return false;
        if (!search) return true;

        return (
          includes(customer.fullName, search) ||
          includes(customer.phone, search) ||
          includes(customer.email, search) ||
          includes(customer.id, search) ||
          vehicles
            .filter((vehicle) => vehicle.customerId === customer.id)
            .some((vehicle) => includes(vehicle.plate, search))
        );
      });
    },
  });
}

export function useSearchCustomers(params: SearchCustomerParams = {}, options: QueryOptions = {}) {
  return useQuery<Customer[]>({
    queryKey: ["staff", "customers", "search", params],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => customers.filter((customer) => customerMatchesSearch(customer, params)),
  });
}

export function useCreateCustomer() {
  return useMutation<Customer, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const customerId = makeId("cust");
      const now = new Date().toISOString();
      const newVehicles = (data.vehicles ?? []).map((vehicle: Record<string, any>) => ({
        id: makeId("veh"),
        customerId,
        make: vehicle.make,
        model: vehicle.model,
        year: Number(vehicle.year),
        plate: vehicle.plate,
        color: vehicle.color ?? null,
        fuelType: vehicle.fuelType ?? null,
        engineCc: vehicle.engineCc ? Number(vehicle.engineCc) : null,
      }));

      const customer: Customer = {
        id: customerId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,
        nid: data.nid ?? null,
        dob: data.dob ?? null,
        address: data.address ?? null,
        creditLimit: Number(data.creditLimit ?? 0),
        creditBalance: 0,
        totalSpend: 0,
        vehiclesCount: newVehicles.length,
        visitCount: 0,
        lastVisit: null,
        memberSince: now,
        regular: false,
      };

      customers.unshift(customer);
      vehicles.unshift(...newVehicles);

      if (data.notes) {
        notes.unshift({
          id: makeId("note"),
          customerId,
          body: String(data.notes),
          author: staffUser.name,
          createdAt: now,
        });
      }

      return customer;
    },
  });
}

export function useGetCustomer(id: string, options: QueryOptions = {}) {
  return useQuery<CustomerProfileResult | null>({
    queryKey: ["staff", "customers", id],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => {
      const customer = getCustomer(id);
      if (!customer) return null;

      return {
        customer,
        totalSpend: customer.totalSpend,
        memberSince: customer.memberSince,
      };
    },
  });
}

export function useGetCustomerVehicles(id: string, options: QueryOptions = {}) {
  return useQuery<Vehicle[]>({
    queryKey: ["staff", "customers", id, "vehicles"],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => vehicles.filter((vehicle) => vehicle.customerId === id),
  });
}

export function useGetCustomerPurchases(id: string, options: QueryOptions = {}) {
  return useQuery<InvoiceSummary[]>({
    queryKey: ["staff", "customers", id, "purchases"],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => invoices.filter((invoice) => invoice.customerId === id).map(invoiceSummary),
  });
}

export function useGetCustomerServices(id: string, options: QueryOptions = {}) {
  return useQuery<ServiceRecord[]>({
    queryKey: ["staff", "customers", id, "services"],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => services.filter((service) => service.customerId === id),
  });
}

export function useGetCustomerCredit(id: string, options: QueryOptions = {}) {
  return useQuery<{ transactions: CreditTransaction[] }>({
    queryKey: ["staff", "customers", id, "credit"],
    enabled: options.query?.enabled ?? true,
    queryFn: async () => ({
      transactions: creditTransactions.filter((transaction) => transaction.customerId === id),
    }),
  });
}

export function useGetCustomerNotes(id: string, options: QueryOptions = {}) {
  return useQuery<CustomerNote[]>({
    queryKey: getGetCustomerNotesQueryKey(id),
    enabled: options.query?.enabled ?? true,
    queryFn: async () => notes.filter((note) => note.customerId === id),
  });
}

export function useAddCustomerNote() {
  return useMutation<CustomerNote, Error, { id: string; data: { body: string } }>({
    mutationFn: async ({ id, data }) => {
      const note: CustomerNote = {
        id: makeId("note"),
        customerId: id,
        body: data.body,
        author: staffUser.name,
        createdAt: new Date().toISOString(),
      };
      notes.unshift(note);
      return note;
    },
  });
}

export function useListInvoices(params: InvoiceListParams = {}) {
  return useQuery<InvoiceSummary[]>({
    queryKey: ["staff", "invoices", params],
    queryFn: async () => {
      const search = params.search?.trim() ?? "";
      return invoices
        .map(invoiceSummary)
        .filter((invoice) => {
          if (params.status && invoice.status !== params.status) return false;
          if (!search) return true;
          return includes(invoice.invoiceNumber, search) || includes(invoice.customerName, search);
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },
  });
}

export function useGetInvoice(id: string, options: QueryOptions = {}) {
  return useQuery<InvoiceDetail | null>({
    queryKey: getGetInvoiceQueryKey(id),
    enabled: options.query?.enabled ?? true,
    queryFn: async () => {
      const invoice = invoices.find((item) => item.id === id);
      if (!invoice) return null;

      return {
        invoice,
        items: invoiceItems.get(invoice.id) ?? [],
        customer: getCustomer(invoice.customerId) ?? null,
        vehicle: getVehicle(invoice.vehicleId) ?? null,
        staffName: invoice.staffName,
        notes: invoice.notes,
      };
    },
  });
}

export function useMarkInvoicePaid() {
  return useMutation<Invoice, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const invoice = invoices.find((item) => item.id === id);
      if (!invoice) throw new Error("Invoice not found.");

      invoice.status = "paid";
      invoice.paymentMethod = invoice.paymentMethod === "credit" ? "cash" : invoice.paymentMethod;

      const customer = getCustomer(invoice.customerId);
      if (customer && customer.creditBalance > 0) {
        customer.creditBalance = Math.max(0, customer.creditBalance - invoice.total);
        creditTransactions.unshift({
          id: makeId("credit"),
          customerId: customer.id,
          date: new Date().toISOString(),
          type: "payment",
          notes: `Payment for ${invoice.invoiceNumber}`,
          invoiceId: invoice.id,
          amount: invoice.total,
          balanceAfter: customer.creditBalance,
        });
      }

      return invoice;
    },
  });
}

export function useSendInvoiceEmail() {
  return useMutation<{ id: string; sentTo: unknown; sentAt: string }, Error, { id: string; data: Record<string, any> }>({
    mutationFn: async ({ id, data }) => ({
      id,
      sentTo: data.to,
      sentAt: new Date().toISOString(),
    }),
  });
}

export function useListNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: getListNotificationsQueryKey(),
    queryFn: async () => notifications,
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      for (const notification of notifications) {
        notification.read = true;
      }
    },
  });
}

export function useGetLowStockParts() {
  return useQuery<Part[]>({
    queryKey: ["staff", "parts", "low-stock"],
    queryFn: async () => listLowStockParts(),
  });
}

export function useListParts(params: PartListParams = {}) {
  return useQuery<Part[]>({
    queryKey: ["staff", "parts", params],
    queryFn: async () => {
      const search = params.search?.trim() ?? "";
      return parts.filter((part) => {
        if (!search) return true;
        return includes(part.name, search) || includes(part.partNumber, search);
      });
    },
  });
}

export function useCreateSale() {
  return useMutation<InvoiceDetail, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => {
      const now = new Date().toISOString();
      const id = makeId("inv");
      const items: InvoiceItem[] = (data.items ?? []).map((item: { partId: string; quantity: number }) => {
        const part = parts.find((row) => row.id === item.partId);
        if (!part) throw new Error("Part not found.");
        if (part.stock < item.quantity) throw new Error("Insufficient stock.");

        part.stock -= item.quantity;

        return {
          id: makeId("item"),
          partId: part.id,
          partNumber: part.partNumber,
          name: part.name,
          quantity: item.quantity,
          unitPrice: part.unitPrice,
          subtotal: part.unitPrice * item.quantity,
        };
      });
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discount = subtotal >= 5000 ? subtotal * 0.1 : 0;
      const total = subtotal - discount;
      const status: InvoiceStatus = data.paymentMethod === "credit" || data.addToCredit ? "credit" : "paid";
      const invoice: Invoice = {
        id,
        invoiceNumber: `INV-2026-${String(nextInvoiceNumber++).padStart(4, "0")}`,
        customerId: data.customerId ?? null,
        walkInName: data.walkInName ?? null,
        vehicleId: data.vehicleId ?? null,
        staffName: staffUser.name,
        createdAt: now,
        status,
        paymentMethod: data.paymentMethod,
        subtotal,
        discount,
        total,
        notes: data.notes ?? null,
      };

      invoices.unshift(invoice);
      invoiceItems.set(id, items);

      const customer = getCustomer(invoice.customerId);
      if (customer) {
        customer.totalSpend += total;
        customer.visitCount += 1;
        customer.lastVisit = now;
        customer.regular = customer.visitCount >= 2;

        if (status === "credit") {
          customer.creditBalance += total;
          creditTransactions.unshift({
            id: makeId("credit"),
            customerId: customer.id,
            date: now,
            type: "charge",
            invoiceId: invoice.id,
            amount: total,
            balanceAfter: customer.creditBalance,
          });
        }
      }

      for (const part of parts) {
        if (part.stock <= part.reorderLevel) {
          notifications.unshift({
            id: makeId("notif"),
            type: "low_stock",
            title: `${part.name} needs restock`,
            message: `${part.partNumber} has ${part.stock} units left.`,
            read: false,
            createdAt: now,
            link: "/sales/new",
          });
        }
      }

      return {
        invoice,
        items,
        customer: customer ?? null,
        vehicle: getVehicle(invoice.vehicleId) ?? null,
        staffName: invoice.staffName,
      };
    },
  });
}

export function useGetRegularCustomersReport(params: { minVisits?: number } = {}) {
  return useQuery<RegularCustomerReportRow[]>({
    queryKey: ["staff", "reports", "regular-customers", params],
    queryFn: async () =>
      customers
        .filter((customer) => customer.visitCount >= (params.minVisits ?? 2))
        .map((customer) => ({
          customerId: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          visitCount: customer.visitCount,
          totalSpend: customer.totalSpend,
          lastVisit: customer.lastVisit ?? customer.memberSince,
        })),
  });
}

export function useGetHighSpendersReport(params: { limit?: number } = {}) {
  return useQuery<HighSpenderReportRow[]>({
    queryKey: ["staff", "reports", "high-spenders", params],
    queryFn: async () =>
      customers
        .slice()
        .sort((left, right) => right.totalSpend - left.totalSpend)
        .slice(0, params.limit ?? 10)
        .map((customer) => ({
          customerId: customer.id,
          fullName: customer.fullName,
          totalSpend: customer.totalSpend,
          avgPerVisit: customer.visitCount ? customer.totalSpend / customer.visitCount : customer.totalSpend,
          visitCount: customer.visitCount,
        })),
  });
}

export function useGetPendingCreditsReport() {
  return useQuery<PendingCreditReportRow[]>({
    queryKey: ["staff", "reports", "pending-credits"],
    queryFn: async () => getPendingCreditsReportRows(),
  });
}

export function useGetSalesSummaryReport() {
  return useQuery<SalesSummaryReport>({
    queryKey: ["staff", "reports", "sales-summary"],
    queryFn: async () => getSalesSummaryData(),
  });
}

export function useSendCreditReminder() {
  return useMutation<{ sentTo: unknown; sentAt: string }, Error, { data: Record<string, any> }>({
    mutationFn: async ({ data }) => ({
      sentTo: data.to,
      sentAt: new Date().toISOString(),
    }),
  });
}
