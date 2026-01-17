import { pgTable, text, timestamp, primaryKey, integer, boolean, real, index } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

// Users table
export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // For credentials login
});

// Accounts table (for OAuth providers)
export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// Sessions table
export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// Verification tokens table
export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Tasks table
export const tasks = pgTable(
  'task',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Task information
    title: text('title').notNull(),
    description: text('description'),

    // Scheduling
    dueDate: timestamp('dueDate', { mode: 'date' }),

    // Organization
    priority: text('priority'), // 'low' | 'medium' | 'high'
    tags: text('tags').array(), // Array of tags

    // Progress
    progress: integer('progress').notNull().default(0), // 0-100
    archived: boolean('archived').notNull().default(false),

    // // Ocean Ball visual properties
    // color: text('color').notNull(),
    // density: real('density').notNull(), // 0-1, controls vertical position

    // Timestamps
    createAt: timestamp('createDate', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
    completedAt: timestamp('completedAt', { mode: 'date' }),
  },
  (table) => ({
    userIdIdx: index('task_user_id_idx').on(table.userId),
    archivedIdx: index('task_archived_idx').on(table.archived),
    dueDateIdx: index('task_due_date_idx').on(table.dueDate),
  })
);

// Milestones table
export const milestones = pgTable(
  'milestone',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    taskId: text('taskId')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),

    // Milestone information
    title: text('title').notNull(),
    description: text('description'),

    // Status
    order: integer('order').notNull(), // For sorting milestones
    completed: boolean('completed').notNull().default(false),

    // Timestamps
    createAt: timestamp('createDate', { mode: 'date' }).notNull().defaultNow(),
    completedAt: timestamp('completedAt', { mode: 'date' }),
  },
  (table) => ({
    taskIdIdx: index('milestone_task_id_idx').on(table.taskId),
  })
);
