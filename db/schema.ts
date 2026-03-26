import { pgTable, text, timestamp, boolean, uuid, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  hostId: uuid('host_id').references(() => users.id).notNull(),
  categorySlug: text('category_slug').references(() => categories.slug).notNull(),
  dateTime: timestamp('date_time').notNull(),
  locationName: text('location_name').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  coverImageUrl: text('cover_image_url'),
  maxAttendees: integer('max_attendees'),
  isPrivate: boolean('is_private').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rsvps = pgTable('rsvps', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(), // 'going', 'waitlist', 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  emoji: text('emoji'),
});

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
});

export const eventTags = pgTable('event_tags', {
  eventId: uuid('event_id').references(() => events.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  hostedEvents: many(events),
  rsvps: many(rsvps),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [events.categorySlug],
    references: [categories.slug],
  }),
  rsvps: many(rsvps),
  eventTags: many(eventTags),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  event: one(events, {
    fields: [rsvps.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  eventTags: many(eventTags),
}));

export const eventTagsRelations = relations(eventTags, ({ one }) => ({
  event: one(events, {
    fields: [eventTags.eventId],
    references: [events.id],
  }),
  tag: one(tags, {
    fields: [eventTags.tagId],
    references: [tags.id],
  }),
}));
