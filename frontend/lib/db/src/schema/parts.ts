import { pgTable, serial, text, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

export const partsTable = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stockQty: integer("stock_qty").notNull().default(0),
  description: text("description"),
  imageUrl: text("image_url"),
  partNumber: text("part_number"),
  compatibleModels: jsonb("compatible_models").$type<string[]>().notNull().default([]),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Part = typeof partsTable.$inferSelect;
export type InsertPart = typeof partsTable.$inferInsert;
