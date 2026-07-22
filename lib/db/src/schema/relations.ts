import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { listingsTable, listingImagesTable } from "./listings";
import { favoritesTable } from "./favorites";
import { conversationsTable, messagesTable } from "./messages";

export const usersRelations = relations(usersTable, ({ many }) => ({
  listings: many(listingsTable),
  favorites: many(favoritesTable),
}));

export const listingsRelations = relations(listingsTable, ({ one, many }) => ({
  seller: one(usersTable, {
    fields: [listingsTable.sellerId],
    references: [usersTable.id],
  }),
  images: many(listingImagesTable),
  favorites: many(favoritesTable),
}));

export const listingImagesRelations = relations(listingImagesTable, ({ one }) => ({
  listing: one(listingsTable, {
    fields: [listingImagesTable.listingId],
    references: [listingsTable.id],
  }),
}));

export const favoritesRelations = relations(favoritesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [favoritesTable.userId],
    references: [usersTable.id],
  }),
  listing: one(listingsTable, {
    fields: [favoritesTable.listingId],
    references: [listingsTable.id],
  }),
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  listing: one(listingsTable, {
    fields: [conversationsTable.listingId],
    references: [listingsTable.id],
  }),
  buyer: one(usersTable, {
    fields: [conversationsTable.buyerId],
    references: [usersTable.id],
  }),
  seller: one(usersTable, {
    fields: [conversationsTable.sellerId],
    references: [usersTable.id],
  }),
  messages: many(messagesTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversationId],
    references: [conversationsTable.id],
  }),
  sender: one(usersTable, {
    fields: [messagesTable.senderId],
    references: [usersTable.id],
  }),
}));
