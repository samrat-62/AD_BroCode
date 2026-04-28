import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type {
  AIPrediction,
  Appointment,
  AppointmentInput,
  Customer,
  Notification,
  NotificationSettings,
  Order,
  OrderInput,
  Part,
  PartCategory,
  PartRequest,
  PartRequestInput,
  Review,
  ReviewInput,
  Vehicle,
  VehicleInput,
} from "@workspace/api-client-react";

type ApiRequest = IncomingMessage & {
  method?: string;
  url?: string;
};

const now = new Date();

const day = (offset: number, hour = 9) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const customer: Customer = {
  id: 1,
  fullName: "Demo Driver",
  email: "demo@autoparts.com",
  phone: "+977 9800000000",
  address: "Kathmandu, Nepal",
  dob: "1995-05-10",
  avatarUrl: null,
  totalSpend: 128500,
  loyaltyPoints: 2460,
  createdAt: day(-420),
  notificationSettings: {
    emailInvoices: true,
    appointmentReminders: true,
    aiAlerts: true,
    promotionalOffers: false,
    overdueReminders: true,
  },
};

let vehicles: Vehicle[] = [
  {
    id: 1,
    make: "Toyota",
    model: "Camry",
    year: 2018,
    plate: "BA 12 CHA 3456",
    color: "Silver",
    engineCC: 2494,
    fuelType: "Petrol",
    photoUrl: "/images/vehicle-sedan.png",
    status: "active",
  },
  {
    id: 2,
    make: "Hyundai",
    model: "Tucson",
    year: 2021,
    plate: "BA 20 PA 7812",
    color: "Blue",
    engineCC: 1999,
    fuelType: "Diesel",
    photoUrl: "/images/vehicle-suv.png",
    status: "active",
  },
  {
    id: 3,
    make: "Yamaha",
    model: "FZ",
    year: 2020,
    plate: "BA 88 PA 1166",
    color: "Black",
    engineCC: 149,
    fuelType: "Petrol",
    photoUrl: "/images/vehicle-motorcycle.png",
    status: "active",
  },
];

let appointments: Appointment[] = [
  {
    id: 1,
    vehicleId: 1,
    vehicleLabel: "2018 Toyota Camry",
    serviceType: "Oil Change",
    scheduledAt: day(4, 10),
    status: "confirmed",
    notes: "Use synthetic oil.",
    technician: "Ramesh",
    cost: null,
    hasReview: false,
  },
  {
    id: 2,
    vehicleId: 2,
    vehicleLabel: "2021 Hyundai Tucson",
    serviceType: "Brake Inspection & Repair",
    scheduledAt: day(-16, 14),
    status: "completed",
    notes: "Front brake pads replaced.",
    technician: "Sujan",
    cost: 14500,
    hasReview: false,
  },
  {
    id: 3,
    vehicleId: 1,
    vehicleLabel: "2018 Toyota Camry",
    serviceType: "Engine Diagnostics",
    scheduledAt: day(-48, 11),
    status: "completed",
    notes: "Sensor scan and air filter replacement.",
    technician: "Milan",
    cost: 8200,
    hasReview: true,
  },
];

let parts: Part[] = [
  {
    id: 1,
    name: "Premium Brake Pads",
    category: "Brakes",
    price: 4200,
    stockQty: 12,
    description: "Ceramic brake pads for reliable stopping power.",
    imageUrl: "/images/part-brake-pads.png",
    partNumber: "BRK-4821",
    compatibleModels: ["Toyota Camry", "Hyundai Tucson"],
    popularity: 97,
    createdAt: day(-40),
  },
  {
    id: 2,
    name: "Synthetic Oil Filter",
    category: "Engine",
    price: 1150,
    stockQty: 30,
    description: "Long-life oil filter for petrol engines.",
    imageUrl: "/images/part-oil-filter.png",
    partNumber: "OIL-1109",
    compatibleModels: ["Toyota Camry"],
    popularity: 91,
    createdAt: day(-32),
  },
  {
    id: 3,
    name: "Engine Air Filter",
    category: "Engine",
    price: 1350,
    stockQty: 4,
    description: "High-flow replacement air filter.",
    imageUrl: "/images/part-air-filter.png",
    partNumber: "AIR-7220",
    compatibleModels: ["Toyota Camry", "Hyundai Tucson"],
    popularity: 88,
    createdAt: day(-21),
  },
  {
    id: 4,
    name: "LED Headlight Assembly",
    category: "Lighting",
    price: 9800,
    stockQty: 2,
    description: "Bright LED headlight assembly.",
    imageUrl: "/images/part-headlight.png",
    partNumber: "LGT-9021",
    compatibleModels: ["Hyundai Tucson"],
    popularity: 73,
    createdAt: day(-14),
  },
  {
    id: 5,
    name: "Iridium Spark Plug Set",
    category: "Ignition",
    price: 3600,
    stockQty: 18,
    description: "Set of four iridium spark plugs.",
    imageUrl: "/images/part-spark-plug.png",
    partNumber: "SPK-4550",
    compatibleModels: ["Toyota Camry"],
    popularity: 85,
    createdAt: day(-18),
  },
  {
    id: 6,
    name: "All-Weather Tyre",
    category: "Tyres",
    price: 11200,
    stockQty: 0,
    description: "Durable all-weather tyre.",
    imageUrl: "/images/part-tyre.png",
    partNumber: "TYR-22555",
    compatibleModels: ["Toyota Camry", "Hyundai Tucson"],
    popularity: 80,
    createdAt: day(-10),
  },
];

let orders: Order[] = [
  {
    id: 1,
    total: 5350,
    subtotal: 5350,
    discount: 0,
    status: "completed",
    deliveryType: "pickup",
    paymentMethod: "cash_on_delivery",
    createdAt: day(-12, 16),
    items: [
      { id: 1, partId: 1, partName: "Premium Brake Pads", quantity: 1, unitPrice: 4200 },
      { id: 2, partId: 2, partName: "Synthetic Oil Filter", quantity: 1, unitPrice: 1150 },
    ],
  },
];

let requests: PartRequest[] = [
  {
    id: 1,
    partName: "Right side mirror assembly",
    partNumber: "87940-06120",
    vehicleId: 1,
    vehicleLabel: "2018 Toyota Camry",
    description: "Prefer genuine or OEM equivalent.",
    imageUrl: null,
    status: "pending",
    createdAt: day(-3),
  },
];

let reviews: Review[] = [
  {
    id: 1,
    appointmentId: 3,
    appointmentLabel: "Engine Diagnostics - 2018 Toyota Camry",
    rating: 5,
    title: "Clear diagnosis",
    body: "The team explained the issue clearly and completed the service on time.",
    status: "published",
    createdAt: day(-45),
  },
];

let notifications: Notification[] = [
  {
    id: 1,
    type: "appointment",
    title: "Service confirmed",
    message: "Your oil change appointment has been confirmed.",
    read: false,
    createdAt: day(-1, 9),
  },
  {
    id: 2,
    type: "ai",
    title: "Brake pads need attention",
    message: "Your Tucson brake pads show a medium risk prediction.",
    read: false,
    createdAt: day(-2, 15),
  },
  {
    id: 3,
    type: "order",
    title: "Order completed",
    message: "Your parts order is ready in purchase history.",
    read: true,
    createdAt: day(-8, 13),
  },
];

let predictions: AIPrediction[] = [
  {
    id: 1,
    vehicleId: 2,
    vehicleLabel: "2021 Hyundai Tucson",
    partName: "Brake Pads",
    riskLevel: "medium",
    recommendedAction: "Schedule a brake inspection within the next month.",
    estimatedFailureWindow: "30-45 days",
    predictedAt: day(-2),
  },
  {
    id: 2,
    vehicleId: 1,
    vehicleLabel: "2018 Toyota Camry",
    partName: "Air Filter",
    riskLevel: "low",
    recommendedAction: "Replace during your next scheduled service.",
    estimatedFailureWindow: "90+ days",
    predictedAt: day(-5),
  },
];

function nextId(items: Array<{ id: number }>): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function vehicleLabel(vehicleId: number): string {
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown vehicle";
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function sendEmpty(res: ServerResponse, status = 204): void {
  res.statusCode = status;
  res.end();
}

function sendNotFound(res: ServerResponse): void {
  sendJson(res, 404, { message: "Not found" });
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }

  return raw.trim() ? (JSON.parse(raw) as T) : ({} as T);
}

function listAppointments(status: string | null): Appointment[] {
  if (status === "upcoming") {
    return appointments.filter((item) => ["pending", "confirmed"].includes(item.status));
  }
  if (status === "past") {
    return appointments.filter((item) => ["completed", "cancelled"].includes(item.status));
  }
  return appointments;
}

function listParts(url: URL): Part[] {
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search")?.toLowerCase();
  const inStock = url.searchParams.get("inStock") === "true";
  const sort = url.searchParams.get("sort");

  let result = parts.filter((part) => {
    if (category && part.category !== category) return false;
    if (inStock && part.stockQty <= 0) return false;
    if (search) {
      const haystack = `${part.name} ${part.category} ${part.partNumber ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  result = [...result];
  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "newest") {
    result.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""));
  } else {
    result.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  return result;
}

function categories(): PartCategory[] {
  const counts = parts.reduce<Record<string, number>>((acc, part) => {
    acc[part.category] = (acc[part.category] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

function dashboardActivity(limit: number): Array<{
  id: string;
  type: "purchase" | "appointment" | "request" | "review";
  title: string;
  status: string;
  amount?: number | null;
  occurredAt: string;
}> {
  const activity = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: "purchase" as const,
      title: `Order #${order.id.toString().padStart(5, "0")}`,
      status: order.status,
      amount: order.total,
      occurredAt: order.createdAt,
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment" as const,
      title: appointment.serviceType,
      status: appointment.status,
      amount: appointment.cost,
      occurredAt: appointment.scheduledAt,
    })),
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      type: "request" as const,
      title: request.partName,
      status: request.status,
      amount: null,
      occurredAt: request.createdAt,
    })),
    ...reviews.map((review) => ({
      id: `review-${review.id}`,
      type: "review" as const,
      title: review.title ?? "Service review",
      status: review.status,
      amount: null,
      occurredAt: review.createdAt,
    })),
  ];

  return activity
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);
}

async function handleApi(req: ApiRequest, res: ServerResponse): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  const url = new URL(req.url ?? "/", "http://local.dev");
  const path = url.pathname.replace(/^\/api/, "") || "/";

  if (method === "GET" && path === "/healthz") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (path === "/me" && method === "GET") {
    sendJson(res, 200, customer);
    return;
  }

  if (path === "/me" && method === "PUT") {
    Object.assign(customer, await readJson<Partial<Customer>>(req));
    sendJson(res, 200, customer);
    return;
  }

  if (path === "/me/notification-settings" && method === "PUT") {
    customer.notificationSettings = await readJson<NotificationSettings>(req);
    sendJson(res, 200, customer.notificationSettings);
    return;
  }

  if (path === "/me/loyalty" && method === "GET") {
    sendJson(res, 200, {
      tier: "Gold",
      totalSpend: customer.totalSpend,
      nextTier: "Platinum",
      nextTierThreshold: 200000,
      progressPercent: Math.round((customer.totalSpend / 200000) * 100),
      benefits: [
        "10% parts discount on eligible orders",
        "Priority service appointment slots",
        "Free yearly vehicle health check",
      ],
      recentDiscounts: [{ orderId: 1, amount: 520, appliedAt: day(-12) }],
    });
    return;
  }

  if (path === "/dashboard/summary" && method === "GET") {
    sendJson(res, 200, {
      totalPurchases: orders.length,
      activeAppointments: appointments.filter((item) =>
        ["pending", "confirmed"].includes(item.status),
      ).length,
      loyaltyPoints: customer.loyaltyPoints,
      pendingRequests: requests.filter((item) => item.status === "pending").length,
      lifetimeSpend: customer.totalSpend,
      vehicleCount: vehicles.length,
    });
    return;
  }

  if (path === "/dashboard/activity" && method === "GET") {
    const limit = Number(url.searchParams.get("limit") ?? "10");
    sendJson(res, 200, dashboardActivity(Number.isNaN(limit) ? 10 : limit));
    return;
  }

  if (path === "/vehicles" && method === "GET") {
    sendJson(res, 200, vehicles);
    return;
  }

  if (path === "/vehicles" && method === "POST") {
    const input = await readJson<VehicleInput>(req);
    const vehicle: Vehicle = {
      id: nextId(vehicles),
      make: input.make,
      model: input.model,
      year: input.year,
      plate: input.plate,
      color: input.color ?? null,
      engineCC: input.engineCC ?? null,
      fuelType: input.fuelType ?? "Petrol",
      photoUrl: input.photoUrl ?? null,
      status: input.status ?? "active",
    };
    vehicles = [vehicle, ...vehicles];
    sendJson(res, 201, vehicle);
    return;
  }

  const vehicleMatch = path.match(/^\/vehicles\/(\d+)$/);
  if (vehicleMatch) {
    const id = Number(vehicleMatch[1]);
    const existing = vehicles.find((item) => item.id === id);
    if (!existing) {
      sendNotFound(res);
      return;
    }
    if (method === "GET") {
      sendJson(res, 200, existing);
      return;
    }
    if (method === "PUT") {
      Object.assign(existing, await readJson<Partial<Vehicle>>(req));
      sendJson(res, 200, existing);
      return;
    }
    if (method === "DELETE") {
      vehicles = vehicles.filter((item) => item.id !== id);
      sendEmpty(res);
      return;
    }
  }

  if (path === "/appointments/time-slots" && method === "GET") {
    sendJson(res, 200, ["09:00", "10:30", "12:00", "14:00", "15:30"]);
    return;
  }

  if (path === "/appointments" && method === "GET") {
    sendJson(res, 200, listAppointments(url.searchParams.get("status")));
    return;
  }

  if (path === "/appointments" && method === "POST") {
    const input = await readJson<AppointmentInput>(req);
    const appointment: Appointment = {
      id: nextId(appointments),
      vehicleId: input.vehicleId,
      vehicleLabel: vehicleLabel(input.vehicleId),
      serviceType: input.serviceType,
      scheduledAt: input.scheduledAt,
      status: input.status ?? "pending",
      notes: input.notes ?? null,
      technician: null,
      cost: null,
      hasReview: false,
    };
    appointments = [appointment, ...appointments];
    sendJson(res, 201, appointment);
    return;
  }

  const appointmentMatch = path.match(/^\/appointments\/(\d+)$/);
  if (appointmentMatch) {
    const id = Number(appointmentMatch[1]);
    const existing = appointments.find((item) => item.id === id);
    if (!existing) {
      sendNotFound(res);
      return;
    }
    if (method === "PUT") {
      Object.assign(existing, await readJson<Partial<Appointment>>(req));
      sendJson(res, 200, existing);
      return;
    }
    if (method === "DELETE") {
      existing.status = "cancelled";
      sendEmpty(res);
      return;
    }
  }

  if (path === "/parts/categories" && method === "GET") {
    sendJson(res, 200, categories());
    return;
  }

  if (path === "/parts" && method === "GET") {
    sendJson(res, 200, listParts(url));
    return;
  }

  const partMatch = path.match(/^\/parts\/(\d+)$/);
  if (partMatch && method === "GET") {
    const part = parts.find((item) => item.id === Number(partMatch[1]));
    part ? sendJson(res, 200, part) : sendNotFound(res);
    return;
  }

  if (path === "/orders" && method === "GET") {
    sendJson(res, 200, orders);
    return;
  }

  if (path === "/orders" && method === "POST") {
    const input = await readJson<OrderInput>(req);
    const items = input.items.map((item, index) => {
      const part = parts.find((candidate) => candidate.id === item.partId);
      return {
        id: index + 1,
        partId: item.partId,
        partName: part?.name ?? `Part #${item.partId}`,
        quantity: item.quantity,
        unitPrice: part?.price ?? 0,
      };
    });
    const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const discount = subtotal >= 5000 ? subtotal * 0.1 : 0;
    const order: Order = {
      id: nextId(orders),
      total: subtotal - discount,
      subtotal,
      discount,
      status: "processing",
      deliveryType: input.deliveryType,
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
      items,
    };
    orders = [order, ...orders];
    sendJson(res, 201, order);
    return;
  }

  const orderMatch = path.match(/^\/orders\/(\d+)$/);
  if (orderMatch && method === "GET") {
    const order = orders.find((item) => item.id === Number(orderMatch[1]));
    order ? sendJson(res, 200, order) : sendNotFound(res);
    return;
  }

  if (path === "/requests" && method === "GET") {
    sendJson(res, 200, requests);
    return;
  }

  if (path === "/requests" && method === "POST") {
    const input = await readJson<PartRequestInput & { vehicleLabel?: string }>(req);
    const request: PartRequest = {
      id: nextId(requests),
      partName: input.partName,
      partNumber: input.partNumber ?? null,
      vehicleId: input.vehicleId ?? null,
      vehicleLabel: input.vehicleLabel ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    requests = [request, ...requests];
    sendJson(res, 201, request);
    return;
  }

  if (path === "/reviews" && method === "GET") {
    sendJson(res, 200, reviews);
    return;
  }

  if (path === "/reviews" && method === "POST") {
    const input = await readJson<ReviewInput>(req);
    const appointment = appointments.find((item) => item.id === input.appointmentId);
    const review: Review = {
      id: nextId(reviews),
      appointmentId: input.appointmentId ?? null,
      appointmentLabel: appointment
        ? `${appointment.serviceType} - ${appointment.vehicleLabel}`
        : null,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      status: "published",
      createdAt: new Date().toISOString(),
    };
    reviews = [review, ...reviews];
    if (appointment) appointment.hasReview = true;
    sendJson(res, 201, review);
    return;
  }

  const reviewMatch = path.match(/^\/reviews\/(\d+)$/);
  if (reviewMatch && method === "DELETE") {
    reviews = reviews.filter((item) => item.id !== Number(reviewMatch[1]));
    sendEmpty(res);
    return;
  }

  if (path === "/notifications" && method === "GET") {
    sendJson(res, 200, notifications);
    return;
  }

  const notificationReadMatch = path.match(/^\/notifications\/(\d+)\/read$/);
  if (notificationReadMatch && method === "POST") {
    const notification = notifications.find((item) => item.id === Number(notificationReadMatch[1]));
    if (notification) notification.read = true;
    sendEmpty(res);
    return;
  }

  if (path === "/ai/predictions" && method === "GET") {
    sendJson(res, 200, predictions);
    return;
  }

  const predictionMatch = path.match(/^\/ai\/predictions\/(\d+)$/);
  if (predictionMatch && method === "GET") {
    sendJson(
      res,
      200,
      predictions.filter((item) => item.vehicleId === Number(predictionMatch[1])),
    );
    return;
  }

  sendNotFound(res);
}

export function localMockApi(): Plugin {
  return {
    name: "local-mock-api",
    configureServer(server) {
      server.middlewares.use(async (req: ApiRequest, res, next) => {
        if (!req.url?.startsWith("/api")) {
          next();
          return;
        }

        try {
          await handleApi(req, res);
        } catch (error) {
          console.error("Mock API error:", error);
          sendJson(res, 500, { message: "Mock API error" });
        }
      });
    },
  };
}
