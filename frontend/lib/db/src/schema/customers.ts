import { pgTable, serial, text, integer, jsonb, timestamp, numeric, date } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  dob: date("dob"),
  avatarUrl: text("avatar_url"),
  totalSpend: numeric("total_spend", { precision: 12, scale: 2 }).notNull().default("0"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  notificationSettings: jsonb("notification_settings").$type<{
    emailInvoices: boolean;
    appointmentReminders: boolean;
    aiAlerts: boolean;
    promotionalOffers: boolean;
    overdueReminders: boolean;
  }>().notNull().default({
    emailInvoices: true,
    appointmentReminders: true,
    aiAlerts: true,
    promotionalOffers: false,
    overdueReminders: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
