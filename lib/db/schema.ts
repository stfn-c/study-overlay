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

  // Onboarding progress tracking
  obsInstalled: text('obs_installed'), // 'yes' | 'no' | null
  sceneReady: text('scene_ready'), // 'yes' | 'no' | null

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

// Study Rooms table
export const studyRooms = pgTable('study_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  creatorId: uuid('creator_id').notNull(), // References auth.users(id)
  inviteCode: text('invite_code').notNull().unique(), // Shareable code like "STUDY-XY7K"
  roomImageUrl: text('room_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - anyone can view rooms they're in, creator can delete
  pgPolicy('anyone can view study rooms', {
    for: 'select',
    to: 'public',
    using: sql`true`,
  }),
  pgPolicy('authenticated users can create study rooms', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = creator_id`,
  }),
  pgPolicy('creator can update own rooms', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = creator_id`,
  }),
  pgPolicy('creator can delete own rooms', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = creator_id`,
  }),
])

// Room Participants table
export const roomParticipants = pgTable('room_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull(), // References study_rooms(id)
  userId: uuid('user_id').notNull(), // References auth.users(id)
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'), // Optional custom avatar
  customStatus: text('custom_status'), // Optional status like "Studying Math 📐"
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = away (based on last_ping)
  lastPingAt: timestamp('last_ping_at', { withTimezone: true }).defaultNow(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies
  pgPolicy('anyone can view participants', {
    for: 'select',
    to: 'public',
    using: sql`true`,
  }),
  pgPolicy('authenticated users can join rooms', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('participants can update own data', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('anyone in room can remove participants', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`true`, // Democratic removal - anyone can kick anyone
  }),
])

// Quote Sets table - predefined and custom quote collections
export const quoteSets = pgTable('quote_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // e.g., "Study Motivation", "Success Mindset"
  description: text('description'),
  userId: uuid('user_id'), // null for system/default sets, user ID for custom sets
  isDefault: integer('is_default').notNull().default(0), // 1 = system default, 0 = custom
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - anyone can view default sets, users can manage their own custom sets
  pgPolicy('anyone can view quote sets', {
    for: 'select',
    to: 'public',
    using: sql`is_default = 1 OR auth.uid() = user_id`,
  }),
  pgPolicy('authenticated users can create custom quote sets', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id AND is_default = 0`,
  }),
  pgPolicy('users can update own quote sets', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can delete own quote sets', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
])

// Quotes table - individual quotes belonging to quote sets
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteSetId: uuid('quote_set_id').notNull(), // References quote_sets(id)
  text: text('text').notNull(),
  author: text('author').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - inherit access from parent quote set
  pgPolicy('users can view quotes from accessible sets', {
    for: 'select',
    to: 'public',
    using: sql`EXISTS (
      SELECT 1 FROM quote_sets
      WHERE quote_sets.id = quote_set_id
      AND (quote_sets.is_default = 1 OR quote_sets.user_id = auth.uid())
    )`,
  }),
  pgPolicy('users can add quotes to own sets', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`EXISTS (
      SELECT 1 FROM quote_sets
      WHERE quote_sets.id = quote_set_id
      AND quote_sets.user_id = auth.uid()
    )`,
  }),
  pgPolicy('users can update quotes in own sets', {
    for: 'update',
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM quote_sets
      WHERE quote_sets.id = quote_set_id
      AND quote_sets.user_id = auth.uid()
    )`,
  }),
  pgPolicy('users can delete quotes from own sets', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM quote_sets
      WHERE quote_sets.id = quote_set_id
      AND quote_sets.user_id = auth.uid()
    )`,
  }),
])

// Study Goals table - track progress toward study objectives
export const studyGoals = pgTable('study_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  widgetId: uuid('widget_id').notNull(), // References widgets(id)
  userId: uuid('user_id').notNull(), // References auth.users(id)
  title: text('title').notNull(), // e.g., "Read 5 chapters"
  description: text('description'), // Optional details
  targetValue: integer('target_value').notNull(), // e.g., 5 chapters
  currentValue: integer('current_value').notNull().default(0), // Current progress
  unit: text('unit').notNull(), // e.g., "chapters", "problems", "pages"
  goalType: text('goal_type').notNull(), // 'daily' | 'weekly' | 'monthly' | 'custom'
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }), // Optional deadline for custom goals
  isCompleted: integer('is_completed').notNull().default(0), // 1 = completed, 0 = in progress
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS Policies - users can only access their own goals
  pgPolicy('users can view own goals', {
    for: 'select',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can insert own goals', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can update own goals', {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.uid() = user_id`,
  }),
  pgPolicy('users can delete own goals', {
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
export type StudyRoom = typeof studyRooms.$inferSelect
export type NewStudyRoom = typeof studyRooms.$inferInsert
export type RoomParticipant = typeof roomParticipants.$inferSelect
export type NewRoomParticipant = typeof roomParticipants.$inferInsert
export type QuoteSet = typeof quoteSets.$inferSelect
export type NewQuoteSet = typeof quoteSets.$inferInsert
export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type StudyGoal = typeof studyGoals.$inferSelect
export type NewStudyGoal = typeof studyGoals.$inferInsert
