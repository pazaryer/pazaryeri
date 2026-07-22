import { pgTable, text, timestamp, real, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  phone: text("phone"),
  name: text("name").notNull().default("Kullanıcı"),
  avatar: text("avatar"),
  bio: text("bio"),
  city: text("city"),
  district: text("district"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating").default(0).notNull(),
  totalSales: real("total_sales").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
