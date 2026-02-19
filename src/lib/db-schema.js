/**
 * DB Schema Extraction Utility
 * 
 * Extracts schema information from Supabase for LLM context.
 * This allows agents to understand DB structure without querying data.
 * 
 * Usage:
 *   import { getDBSchema, getTableSchema } from './db-schema';
 *   const schema = await getDBSchema();
 */

import { supabase } from './supabase';

// SQL to extract schema information (run via RPC or direct query)
const SCHEMA_QUERY = `
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  tc.constraint_type,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON t.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
`;

const INDEXES_QUERY = `
SELECT 
  tablename AS table_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
`;

const RLS_QUERY = `
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
`;

const FUNCTIONS_QUERY = `
SELECT 
  routine_name AS function_name,
  routine_type,
  data_type AS return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
`;

/**
 * Get full schema as structured object
 */
export async function getDBSchema() {
  // Check if we can run raw SQL (requires service role or specific permissions)
  // For client-side, we'll return a static schema based on migrations
  
  const schema = {
    tables: getStaticSchema(),
    generatedAt: new Date().toISOString(),
    note: "Schema extracted from migration files. Run 'supabase db dump' for live schema."
  };
  
  return schema;
}

/**
 * Get schema for a specific table
 */
export function getTableSchema(tableName) {
  const schema = getStaticSchema();
  const normalized = tableName.toLowerCase().replace(/"/g, '');
  
  // Try exact match first, then case-insensitive
  if (schema[tableName]) return schema[tableName];
  if (schema[normalized]) return schema[normalized];
  
  // Try quoted version
  const quoted = `"${normalized}"`;
  if (schema[quoted]) return schema[quoted];
  
  return null;
}

/**
 * Static schema derived from migrations
 * This is the source of truth for LLM context
 */
export function getStaticSchema() {
  return {
    // Core tables
    '"CLASSES"': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        name: { type: 'TEXT', nullable: false },
        class_type: { type: 'TEXT', nullable: true },
        start_time: { type: 'TIMESTAMPTZ', nullable: false },
        end_time: { type: 'TIMESTAMPTZ', nullable: false },
        instructor: { type: 'TEXT', nullable: true },
        room: { type: 'TEXT', nullable: true },
        price: { type: 'NUMERIC(10,2)', default: '0' },
        cost: { type: 'NUMERIC(10,2)', default: '0' },
        description: { type: 'TEXT', nullable: true },
        max_capacity: { type: 'INTEGER', nullable: true },
        current_enrollment: { type: 'INTEGER', default: '0' },
        image_url: { type: 'TEXT', nullable: true },
        category_id: { type: 'UUID', fk: 'class_categories.id', nullable: true },
        audience: { type: 'TEXT', check: "IN ('adult', 'children')", nullable: true },
        duration_minutes: { type: 'INTEGER', default: '60' },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' },
        updated_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      indexes: ['idx_classes_category_id', 'idx_classes_start_time'],
      rls: true,
      policies: ['Anyone can read CLASSES', 'Anon can read CLASSES']
    },
    
    '"Users Info"': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false, unique: true },
        name: { type: 'TEXT', nullable: true },
        full_name: { type: 'TEXT', nullable: true },
        current_balance: { type: 'NUMERIC(10,2)', default: '0' },
        phone: { type: 'TEXT', nullable: true },
        avatar_url: { type: 'TEXT', nullable: true },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' },
        updated_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      rls: true,
      policies: ['Users can read own info', 'Users can update own info', 'Users can insert own info']
    },
    
    'enrollments': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false },
        class_id: { type: 'UUID', fk: '"CLASSES".id', nullable: false },
        status: { type: 'TEXT', default: "'active'", check: "IN ('active', 'cancelled')" },
        cancelled_at: { type: 'TIMESTAMPTZ', nullable: true },
        bundle_id: { type: 'UUID', fk: 'user_bundles.id', nullable: true },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      constraints: ['UNIQUE(user_id, class_id)'],
      indexes: ['idx_enrollments_user_id', 'idx_enrollments_status'],
      rls: true
    },
    
    'transactions': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false },
        type: { type: 'TEXT', nullable: false, check: "IN ('topup', 'purchase', 'refund')" },
        amount: { type: 'NUMERIC(10,2)', nullable: false },
        balance_after: { type: 'NUMERIC(10,2)', nullable: true },
        description: { type: 'TEXT', nullable: true },
        class_ids: { type: 'JSONB', nullable: true },
        bundle_id: { type: 'UUID', fk: 'class_bundles.id', nullable: true },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      indexes: ['idx_transactions_user_id'],
      rls: true
    },
    
    'class_categories': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        key: { type: 'TEXT', unique: true, nullable: false },
        name_en: { type: 'TEXT', nullable: false },
        name_zh: { type: 'TEXT', nullable: false },
        icon: { type: 'TEXT', nullable: true },
        has_children: { type: 'BOOLEAN', default: 'true' },
        sort_order: { type: 'INTEGER', default: '0' },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      rls: true
    },
    
    'class_timetable': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        category_id: { type: 'UUID', fk: 'class_categories.id', nullable: true },
        audience: { type: 'TEXT', check: "IN ('adult', 'children')", nullable: true },
        day_of_week: { type: 'INTEGER', check: '>= 0 AND <= 6' },
        start_time: { type: 'TIME', nullable: false },
        duration_minutes: { type: 'INTEGER', default: '60' },
        instructor: { type: 'TEXT', nullable: true },
        room: { type: 'TEXT', nullable: true },
        price_per_class: { type: 'NUMERIC(10,2)', default: '20' },
        is_active: { type: 'BOOLEAN', default: 'true' },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' },
        updated_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      indexes: ['idx_class_timetable_category', 'idx_class_timetable_day'],
      rls: true
    },
    
    'class_bundles': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        category_id: { type: 'UUID', fk: 'class_categories.id', nullable: true },
        audience: { type: 'TEXT', check: "IN ('adult', 'children')", nullable: true },
        class_count: { type: 'INTEGER', nullable: false },
        expiry_weeks: { type: 'INTEGER', nullable: false },
        total_price: { type: 'NUMERIC(10,2)', nullable: false },
        is_active: { type: 'BOOLEAN', default: 'true' },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      rls: true
    },
    
    'user_bundles': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false },
        bundle_id: { type: 'UUID', fk: 'class_bundles.id', nullable: false },
        category_id: { type: 'UUID', fk: 'class_categories.id', nullable: true },
        audience: { type: 'TEXT', nullable: true },
        classes_remaining: { type: 'INTEGER', nullable: false },
        purchased_at: { type: 'TIMESTAMPTZ', default: 'now()' },
        expires_at: { type: 'TIMESTAMPTZ', nullable: false },
        is_active: { type: 'BOOLEAN', default: 'true' }
      },
      indexes: ['idx_user_bundles_user_id', 'idx_user_bundles_expires_at'],
      rls: true
    },
    
    'private_tuition_requests': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false },
        category_id: { type: 'UUID', fk: 'class_categories.id', nullable: true },
        preferred_date: { type: 'DATE', nullable: true },
        preferred_time: { type: 'TIME', nullable: true },
        duration_minutes: { type: 'INTEGER', default: '60' },
        notes: { type: 'TEXT', nullable: true },
        status: { type: 'TEXT', default: "'pending'", check: "IN ('pending', 'confirmed', 'cancelled')" },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      rls: true
    },
    
    'push_tokens': {
      columns: {
        id: { type: 'UUID', pk: true, default: 'gen_random_uuid()' },
        user_id: { type: 'UUID', fk: 'auth.users.id', nullable: false },
        token: { type: 'TEXT', nullable: false },
        platform: { type: 'TEXT', check: "IN ('ios', 'android', 'web')" },
        created_at: { type: 'TIMESTAMPTZ', default: 'now()' },
        updated_at: { type: 'TIMESTAMPTZ', default: 'now()' }
      },
      constraints: ['UNIQUE(user_id, token)'],
      rls: true
    }
  };
}

/**
 * Generate LLM-friendly schema summary
 */
export function generateSchemaSummary() {
  const schema = getStaticSchema();
  let summary = '# Dance Studio App - Database Schema\n\n';
  summary += `Generated: ${new Date().toISOString()}\n\n`;
  summary += '## Tables\n\n';
  
  for (const [tableName, tableInfo] of Object.entries(schema)) {
    summary += `### ${tableName}\n\n`;
    summary += '| Column | Type | Nullable | Default | Notes |\n';
    summary += '|--------|------|----------|---------|-------|\n';
    
    for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
      const notes = [];
      if (colInfo.pk) notes.push('PK');
      if (colInfo.fk) notes.push(`FK → ${colInfo.fk}`);
      if (colInfo.unique) notes.push('UNIQUE');
      if (colInfo.check) notes.push(`CHECK: ${colInfo.check}`);
      
      summary += `| ${colName} | ${colInfo.type} | ${colInfo.nullable === false ? 'NO' : 'YES'} | ${colInfo.default || '-'} | ${notes.join(', ') || '-'} |\n`;
    }
    summary += '\n';
  }
  
  return summary;
}

// RPC Functions available
export const RPC_FUNCTIONS = {
  'topup_balance': {
    params: { p_amount: 'NUMERIC' },
    returns: 'JSON ({ ok: boolean, new_balance?: number, error?: string })',
    description: 'Add funds to user balance. Auto-creates user info if missing.'
  },
  'purchase_bundle': {
    params: { p_bundle_id: 'UUID' },
    returns: 'TABLE(ok BOOLEAN, message TEXT)',
    description: 'Purchase a class bundle using account balance.'
  },
  'cancel_enrollment': {
    params: { p_enrollment_id: 'UUID' },
    returns: 'TABLE(ok BOOLEAN, message TEXT)',
    description: 'Cancel an enrollment and optionally refund balance.'
  }
};
