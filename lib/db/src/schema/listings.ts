import { pgTable, text, timestamp, real, integer, boolean, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const listingStatusEnum = ["active", "sold", "reserved", "deleted"] as const;
export type ListingStatus = (typeof listingStatusEnum)[number];

export const listingsTable = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull().default("active").$type<ListingStatus>(),
    city: text("city"),
    district: text("district"),
    location: text("location"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    acceptsOffers: boolean("accepts_offers").default(true).notNull(),
    views: integer("views").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("listings_seller_idx").on(table.sellerId),
    index("listings_category_idx").on(table.category),
    index("listings_status_idx").on(table.status),
    index("listings_created_idx").on(table.createdAt),
    index("listings_price_idx").on(table.price),
  ],
);

export const listingImagesTable = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("listing_images_listing_idx").on(table.listingId)],
);

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});
export const selectListingSchema = createSelectSchema(listingsTable);
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
export type ListingImage = typeof listingImagesTable.$inferSelect;
