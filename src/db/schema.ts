import { pgTable, serial, text, timestamp, varchar, jsonb, boolean, integer } from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  releaseDate: varchar("release_date", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"), // upcoming, released
  genre: varchar("genre", { length: 100 }),
  developer: varchar("developer", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  platform: varchar("platform", { length: 255 }),
  featured: boolean("featured").default(false),
  rating: varchar("rating", { length: 10 }),
  storeLinks: jsonb("store_links").$type<StoreLink[]>(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type StoreLink = {
  name: string; // Steam, Epic Games, PlayStation Store, etc.
  url: string;
  icon?: string;
};

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
