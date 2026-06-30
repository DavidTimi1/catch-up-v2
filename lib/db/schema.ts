import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull().default('Untitled Lesson'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const images = pgTable('images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  url: text('url').notNull(),
  publicId: text('public_id').notNull(),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const moments = pgTable('moments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  imageId: text('image_id').references(() => images.id, { onDelete: 'set null' }),
  polygons: text('polygons').notNull(),
  highlightLines: text('highlight_lines'),
  explanation: text('explanation').notNull(),
  extraTitle: text('extra_title'),
  extraBody: text('extra_body'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonsRelations = relations(lessons, ({ many }) => ({
  images: many(images),
  moments: many(moments),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [images.lessonId],
    references: [lessons.id],
  }),
  moments: many(moments),
}));

export const momentsRelations = relations(moments, ({ one }) => ({
  lesson: one(lessons, {
    fields: [moments.lessonId],
    references: [lessons.id],
  }),
  image: one(images, {
    fields: [moments.imageId],
    references: [images.id],
  }),
}));
