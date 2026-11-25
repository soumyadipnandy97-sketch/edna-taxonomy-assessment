import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(), // Firebase Auth UID or server-generated UUID for email accounts
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'), // scrypt hash for email/password accounts; null for OAuth-only
    authProvider: text('auth_provider').notNull().default('email'), // 'google' | 'email'
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token'),
    resetToken: text('reset_token'),
    resetTokenExpires: timestamp('reset_token_expires'),
    institution: text('institution').default(''),
    researchInterest: text('research_interest').default('Marine Biodiversity'),
    avatarUrl: text('avatar_url').default(''),
    role: text('role').notNull().default('user'), // 'user' | 'researcher' | 'admin'
    isSuspended: boolean('is_suspended').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_profiles_email').on(table.email),
    index('idx_profiles_role').on(table.role),
  ]
);

export const datasets = pgTable(
  'datasets',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    datasetName: text('dataset_name').notNull(),
    sampleName: text('sample_name').notNull(),
    filePath: text('file_path').notNull(),
    fileFormat: text('file_format').notNull(), // 'FASTA' | 'FASTQ' | 'CSV'
    fileSize: integer('file_size').notNull().default(0),
    sampleType: text('sample_type').notNull().default('Marine'), // Marine | Freshwater | Soil | Terrestrial | Other
    collectionLocation: text('collection_location').default(''),
    collectionDate: text('collection_date').default(''),
    description: text('description').default(''),
    status: text('status').notNull().default('uploaded'), // 'uploaded' | 'processing' | 'completed' | 'failed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_datasets_user_id').on(table.userId),
    index('idx_datasets_status').on(table.status),
  ]
);

export const sequences = pgTable(
  'sequences',
  {
    id: serial('id').primaryKey(),
    datasetId: integer('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    sequenceId: text('sequence_id').notNull(),
    dnaSequence: text('dna_sequence').notNull(),
    sequenceLength: integer('sequence_length').notNull(),
    qualityScore: doublePrecision('quality_score'),
    gcContent: doublePrecision('gc_content'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_sequences_dataset_id').on(table.datasetId),
    index('idx_sequences_seq_id').on(table.sequenceId),
  ]
);

export const taxonomyResults = pgTable(
  'taxonomy_results',
  {
    id: serial('id').primaryKey(),
    datasetId: integer('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    sequenceId: text('sequence_id').notNull(),
    kingdom: text('kingdom').notNull().default('Unclassified'),
    phylum: text('phylum').notNull().default('Unclassified'),
    className: text('class').notNull().default('Unclassified'),
    orderName: text('order_name').notNull().default('Unclassified'),
    family: text('family').notNull().default('Unclassified'),
    genus: text('genus').notNull().default('Unclassified'),
    species: text('species').notNull().default('Unclassified'),
    similarityScore: doublePrecision('similarity_score').notNull().default(0),
    confidenceScore: doublePrecision('confidence_score').notNull().default(0),
    identificationStatus: text('identification_status').notNull(), // 'Identified' | 'Partially identified' | 'Unclassified' | 'Potentially novel sequence'
    referenceDatabase: text('reference_database').notNull(),
    clusterId: text('cluster_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_taxonomy_dataset_id').on(table.datasetId),
    index('idx_taxonomy_status').on(table.identificationStatus),
    index('idx_taxonomy_kingdom').on(table.kingdom),
  ]
);

export const biodiversityResults = pgTable(
  'biodiversity_results',
  {
    id: serial('id').primaryKey(),
    datasetId: integer('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' })
      .unique(),
    speciesRichness: integer('species_richness').notNull().default(0),
    shannonIndex: doublePrecision('shannon_index').notNull().default(0),
    simpsonIndex: doublePrecision('simpson_index').notNull().default(0),
    simpsonDiversity: doublePrecision('simpson_diversity').notNull().default(0),
    evenness: doublePrecision('evenness').notNull().default(0),
    totalSequences: integer('total_sequences').notNull().default(0),
    classifiedCount: integer('classified_count').notNull().default(0),
    unclassifiedCount: integer('unclassified_count').notNull().default(0),
    analysisMetadata: jsonb('analysis_metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_biodiversity_dataset_id').on(table.datasetId)]
);

export const analysisJobs = pgTable(
  'analysis_jobs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    datasetId: integer('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('queued'), // 'queued' | 'running' | 'completed' | 'failed'
    progress: integer('progress').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('idx_jobs_user_id').on(table.userId),
    index('idx_jobs_dataset_id').on(table.datasetId),
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorUserId: text('actor_user_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_actor').on(table.actorUserId),
    index('idx_audit_created').on(table.createdAt),
  ]
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    datasetId: integer('dataset_id').references(() => datasets.id, {
      onDelete: 'set null',
    }),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_chat_user_id').on(table.userId)]
);

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedBy: text('updated_by').default('system'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  institution: text('institution').default(''),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Drizzle Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  datasets: many(datasets),
  analysisJobs: many(analysisJobs),
  chatMessages: many(chatMessages),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [datasets.userId],
    references: [profiles.id],
  }),
  sequences: many(sequences),
  taxonomyResults: many(taxonomyResults),
  biodiversityResult: one(biodiversityResults, {
    fields: [datasets.id],
    references: [biodiversityResults.datasetId],
  }),
  analysisJobs: many(analysisJobs),
}));

export const sequencesRelations = relations(sequences, ({ one }) => ({
  dataset: one(datasets, {
    fields: [sequences.datasetId],
    references: [datasets.id],
  }),
}));

export const taxonomyResultsRelations = relations(taxonomyResults, ({ one }) => ({
  dataset: one(datasets, {
    fields: [taxonomyResults.datasetId],
    references: [datasets.id],
  }),
}));

export const biodiversityResultsRelations = relations(biodiversityResults, ({ one }) => ({
  dataset: one(datasets, {
    fields: [biodiversityResults.datasetId],
    references: [datasets.id],
  }),
}));
