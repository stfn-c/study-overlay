import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, jsonb, timestamp, pgPolicy, integer } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

// Users table - automatically created when user signs up via Google auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Matches auth.users(id)
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),

  // Spotify OAuth credentials
  spotifyAccessToken: text('spotify_access_token'),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyTokenExpiresAt: timestamp('spotify_token_expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - users can only access their own profile
  pgPolicy('users can view own profile', {
    for: 'select',
    to: authenticatedRole,
    using: sql`auth.uid() = id`,
  }),
  pgPolicy('users can update own profile', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = id`,
  }),
])

// Widgets table in the public schema with RLS policies
export const widgets = pgTable('widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  name: text('name').notNull(),
  type: text('type').notNull(), // 'pomodoro' | 'spotify' | 'local'
  config: jsonb('config').notNull().default({}), // Stores widget settings
  state: jsonb('state').default({}), // Stores runtime state (pause/resume, current time, etc)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - users can only access their own widgets
  pgPolicy('authenticated users can view own widgets', {
    for: 'select',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('authenticated users can insert own widgets', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('authenticated users can update own widgets', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('authenticated users can delete own widgets', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
])

// Feature Requests table
export const featureRequests = pgTable('feature_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  title: text('title').notNull(),
  description: text('description').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - everyone can view, only authenticated can create
  pgPolicy('anyone can view feature requests', {
    for: 'select',
    to: 'public',
    using: sql`true`,
  }),
  pgPolicy('authenticated users can insert feature requests', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can update own feature requests', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can delete own feature requests', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
])

// Feature Request Upvotes (junction table to track who voted)
export const featureRequestUpvotes = pgTable('feature_request_upvotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  featureRequestId: uuid('feature_request_id').notNull(), // References feature_requests(id)
  userId: uuid('user_id').notNull(), // References auth.users(id)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies
  pgPolicy('anyone can view upvotes', {
    for: 'select',
    to: 'public',
    using: sql`true`,
  }),
  pgPolicy('authenticated users can insert upvotes', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can delete own upvotes', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
])

// Feature Request Comments
export const featureRequestComments = pgTable('feature_request_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  featureRequestId: uuid('feature_request_id').notNull(), // References feature_requests(id)
  userId: uuid('user_id').notNull(), // References auth.users(id)
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies
  pgPolicy('anyone can view comments', {
    for: 'select',
    to: 'public',
    using: sql`true`,
  }),
  pgPolicy('authenticated users can insert comments', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can update own comments', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can delete own comments', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
])

// Export types for use in your app
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Widget = typeof widgets.$inferSelect
export type NewWidget = typeof widgets.$inferInsert
export type FeatureRequest = typeof featureRequests.$inferSelect
export type NewFeatureRequest = typeof featureRequests.$inferInsert
export type FeatureRequestUpvote = typeof featureRequestUpvotes.$inferSelect
export type NewFeatureRequestUpvote = typeof featureRequestUpvotes.$inferInsert
export type FeatureRequestComment = typeof featureRequestComments.$inferSelect
export type NewFeatureRequestComment = typeof featureRequestComments.$inferInsert
