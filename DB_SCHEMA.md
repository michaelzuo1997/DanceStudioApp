# Dance Studio App - Database Schema

> **For LLM Context**: This document describes the complete database schema. Use this to understand structure without querying data.

Generated: 2025-02-19

## Quick Reference

| Table | Purpose | RLS |
|-------|---------|-----|
| `CLASSES` | Individual class sessions | Yes |
| `Users Info` | User profiles & balance | Yes |
| `enrollments` | Class bookings | Yes |
| `transactions` | Payment history | Yes |
| `class_categories` | Dance types (Ballet, Hip Hop, etc.) | Yes |
| `class_timetable` | Weekly recurring schedule | Yes |
| `class_bundles` | Class pass packages | Yes |
| `user_bundles` | Purchased bundles | Yes |
| `private_tuition_requests` | Private lesson requests | Yes |
| `push_tokens` | Push notification tokens | Yes |

---

## Tables

### `CLASSES`
Individual class sessions (generated from timetable).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | TEXT | NO | - | Class name |
| class_type | TEXT | YES | - | e.g., "ballet", "hip_hop" |
| start_time | TIMESTAMPTZ | NO | - | Start datetime |
| end_time | TIMESTAMPTZ | NO | - | End datetime |
| instructor | TEXT | YES | - | Instructor name |
| room | TEXT | YES | - | e.g., "Studio A" |
| price | NUMERIC(10,2) | YES | 0 | Price per class |
| cost | NUMERIC(10,2) | YES | 0 | Cost to studio |
| description | TEXT | YES | - | Class description |
| max_capacity | INTEGER | YES | - | Max students |
| current_enrollment | INTEGER | YES | 0 | Current count |
| image_url | TEXT | YES | - | Class image |
| category_id | UUID | YES | - | FK → class_categories.id |
| audience | TEXT | YES | - | CHECK: 'adult' or 'children' |
| duration_minutes | INTEGER | YES | 60 | Duration |
| created_at | TIMESTAMPTZ | YES | now() | - |
| updated_at | TIMESTAMPTZ | YES | now() | - |

**Indexes**: `idx_classes_category_id`, `idx_classes_start_time`

---

### `Users Info`
User profiles with balance tracking.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id, UNIQUE |
| name | TEXT | YES | - | Display name |
| full_name | TEXT | YES | - | Full name |
| current_balance | NUMERIC(10,2) | YES | 0 | Account balance in AUD |
| phone | TEXT | YES | - | Phone number |
| avatar_url | TEXT | YES | - | Profile image |
| created_at | TIMESTAMPTZ | YES | now() | - |
| updated_at | TIMESTAMPTZ | YES | now() | - |

---

### `enrollments`
Class bookings.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| class_id | UUID | NO | - | FK → CLASSES.id |
| status | TEXT | YES | 'active' | CHECK: 'active' or 'cancelled' |
| cancelled_at | TIMESTAMPTZ | YES | - | When cancelled |
| bundle_id | UUID | YES | - | FK → user_bundles.id (if booked via bundle) |
| created_at | TIMESTAMPTZ | YES | now() | - |

**Constraints**: `UNIQUE(user_id, class_id)`

---

### `transactions`
Payment/transaction history.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| type | TEXT | NO | - | CHECK: 'topup', 'purchase', 'refund' |
| amount | NUMERIC(10,2) | NO | - | Transaction amount (+ or -) |
| balance_after | NUMERIC(10,2) | YES | - | Balance after transaction |
| description | TEXT | YES | - | Description |
| class_ids | JSONB | YES | - | Array of class UUIDs (for purchases) |
| bundle_id | UUID | YES | - | FK → class_bundles.id |
| created_at | TIMESTAMPTZ | YES | now() | - |

---

### `class_categories`
Dance type categories.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| key | TEXT | NO | - | UNIQUE, e.g., "ballet" |
| name_en | TEXT | NO | - | English name |
| name_zh | TEXT | NO | - | Chinese name |
| icon | TEXT | YES | - | Emoji icon |
| has_children | BOOLEAN | YES | true | Has adult/children variants |
| sort_order | INTEGER | YES | 0 | Display order |
| created_at | TIMESTAMPTZ | YES | now() | - |

**Seeded values**: chinese_classical, ballet, hip_hop, kpop_youth, korean_dance, miscellaneous

---

### `class_timetable`
Weekly recurring class schedule.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| category_id | UUID | YES | - | FK → class_categories.id |
| audience | TEXT | YES | - | CHECK: 'adult' or 'children' |
| day_of_week | INTEGER | YES | - | 0=Sun, 1=Mon, ..., 6=Sat |
| start_time | TIME | NO | - | e.g., "18:00" |
| duration_minutes | INTEGER | YES | 60 | Duration |
| instructor | TEXT | YES | - | Instructor name |
| room | TEXT | YES | - | e.g., "Studio A" |
| price_per_class | NUMERIC(10,2) | YES | 20 | Price |
| is_active | BOOLEAN | YES | true | Active flag |
| created_at | TIMESTAMPTZ | YES | now() | - |
| updated_at | TIMESTAMPTZ | YES | now() | - |

---

### `class_bundles`
Class pass packages (次卡).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| category_id | UUID | YES | - | FK → class_categories.id (null = all categories) |
| audience | TEXT | YES | - | CHECK: 'adult' or 'children' |
| class_count | INTEGER | NO | - | Number of classes |
| expiry_weeks | INTEGER | NO | - | Weeks until expiry |
| total_price | NUMERIC(10,2) | NO | - | Bundle price |
| is_active | BOOLEAN | YES | true | Active flag |
| created_at | TIMESTAMPTZ | YES | now() | - |

**Seeded values**: 10-class ($180), 20-class ($340), 30-class ($480), 40-class ($600)

---

### `user_bundles`
Purchased class bundles.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| bundle_id | UUID | NO | - | FK → class_bundles.id |
| category_id | UUID | YES | - | Category restriction |
| audience | TEXT | YES | - | Audience restriction |
| classes_remaining | INTEGER | NO | - | Classes left |
| purchased_at | TIMESTAMPTZ | YES | now() | - |
| expires_at | TIMESTAMPTZ | NO | - | Expiry date |
| is_active | BOOLEAN | YES | true | Active flag |

---

## RPC Functions

### `topup_balance(p_amount NUMERIC) → JSON`
Add funds to user balance.
- Auto-creates user info if missing
- Returns: `{ ok: boolean, new_balance?: number, error?: string }`

### `purchase_bundle(p_bundle_id UUID) → TABLE(ok BOOLEAN, message TEXT)`
Purchase a class bundle using account balance.
- Deducts from balance
- Creates user_bundles record

### `cancel_enrollment(p_enrollment_id UUID) → TABLE(ok BOOLEAN, message TEXT)`
Cancel a class enrollment.
- If booked via bundle: restores classes_remaining
- If paid directly: refunds to balance

---

## Common Queries

### Get upcoming classes for a category
```sql
SELECT * FROM "CLASSES" 
WHERE category_id = $category_id 
  AND start_time >= NOW() 
ORDER BY start_time;
```

### Get user's active bundles
```sql
SELECT ub.*, cb.class_count 
FROM user_bundles ub
JOIN class_bundles cb ON ub.bundle_id = cb.id
WHERE ub.user_id = $user_id 
  AND ub.is_active = true 
  AND ub.expires_at > NOW();
```

### Check class availability
```sql
SELECT id, max_capacity, current_enrollment,
       (max_capacity - current_enrollment) AS spots_left
FROM "CLASSES" WHERE id = $class_id;
```
