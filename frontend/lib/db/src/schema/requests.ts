import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";
import { vehiclesTable } from "./vehicles";

export const partRequestsTable = pgTable("part_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id, { onDelete: "set null" }),
  partName: text("part_name").notNull(),
  partNumber: text("part_number"),
  description: text("description"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PartRequest = typeof partRequestsTable.$inferSelect;
export type InsertPartRequest = typeof partRequestsTable.$inferInsert;
