import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { vehiclesTable } from "./vehicles";

export const aiPredictionsTable = pgTable("ai_predictions", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  partName: text("part_name").notNull(),
  riskLevel: text("risk_level").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  estimatedFailureWindow: text("estimated_failure_window"),
  predictedAt: timestamp("predicted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AIPrediction = typeof aiPredictionsTable.$inferSelect;
export type InsertAIPrediction = typeof aiPredictionsTable.$inferInsert;
