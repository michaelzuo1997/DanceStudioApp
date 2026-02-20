-- CLEAN RESEED: Wipe seed data and re-seed with consistent, aligned data
-- WARNING: This will delete data in core tables (enrollments, transactions, bundles, timetable, classes, instructors, studios).

-- 1) Truncate dependent data first
TRUNCATE TABLE enrollments RESTART IDENTITY CASCADE;
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_bundles RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_timetable RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_bundles RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE "CLASSES" RESTART IDENTITY CASCADE;
TRUNCATE TABLE instructors RESTART IDENTITY CASCADE;
TRUNCATE TABLE studios RESTART IDENTITY CASCADE;

-- 2) Re-seed categories (including Yoga/Pilates)
INSERT INTO class_categories (key, name_en, name_zh, icon, has_children, sort_order) VALUES
  ('chinese_classical', 'Chinese Classical', '中国舞', '💃', true, 1),
  ('ballet', 'Ballet', '芭蕾', '🩰', true, 2),
  ('hip_hop', 'Hip Hop', '街舞', '🎤', true, 3),
  ('kpop_youth', 'Youth K-pop', '青少年 K-pop', '🎵', true, 4),
  ('korean_dance', 'Korean Dance', '韩舞', '🌟', true, 5),
  ('miscellaneous', 'Miscellaneous', '其他', '✨', false, 6),
  ('yoga', 'Yoga', '瑜伽', '🧘', false, 7),
  ('pilates', 'Pilates', '普拉提', '🤸', false, 8);

-- 3) Re-seed instructors (mock)
INSERT INTO instructors (name, photo_url, bio, experience, awards, contact_email, contact_phone)
VALUES
  ('Mei Lin', NULL, 'Classical Chinese dance specialist.', '10+ years teaching experience', 'National Dance Award 2019', 'mei@example.com', '+61 400 000 001'),
  ('Yuna Park', NULL, 'Korean dance and performance coach.', '8 years teaching K-pop dance', 'Korea Dance Festival Finalist', 'yuna@example.com', '+61 400 000 002');

-- 4) Re-seed studios
INSERT INTO studios (name, address, notes)
VALUES
  ('Studio A', '123 Main St, Sydney NSW', 'Level 2, front desk'),
  ('Studio B', '45 Market Rd, Sydney NSW', 'Enter via side door');

-- 5) Re-seed CLASSES (static definitions)
-- 2 Chinese Classical (adult + children)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Chinese Classical', 'chinese_classical', cc.id, 'adult', 'Hornsby', i.id, s.id, 90, 25, true, 2, '10:00', 10
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'chinese_classical' AND i.name = 'Mei Lin' AND s.name = 'Studio A';

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Chinese Classical', 'chinese_classical', cc.id, 'children', 'Macquarie', i.id, s.id, 60, 20, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'chinese_classical' AND i.name = 'Mei Lin' AND s.name = 'Studio A';

-- 2 Ballet (adult + children)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Ballet', 'ballet', cc.id, 'adult', 'Hornsby', i.id, s.id, 90, 25, true, 1, '18:00', 10
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'ballet' AND i.name = 'Mei Lin' AND s.name = 'Studio B';

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Ballet', 'ballet', cc.id, 'children', 'Macquarie', i.id, s.id, 60, 18, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'ballet' AND i.name = 'Mei Lin' AND s.name = 'Studio B';

-- 1 Hip Hop (adult)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Hip Hop', 'hip_hop', cc.id, 'adult', 'Hornsby', i.id, s.id, 60, 20, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'hip_hop' AND i.name = 'Yuna Park' AND s.name = 'Studio A';

-- 1 Youth K-pop (children)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Youth K-pop', 'kpop_youth', cc.id, 'children', 'Hornsby', i.id, s.id, 90, 22, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'kpop_youth' AND i.name = 'Yuna Park' AND s.name = 'Studio A';

-- 1 Korean Dance (adult)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Korean Dance', 'korean_dance', cc.id, 'adult', 'Macquarie', i.id, s.id, 60, 22, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'korean_dance' AND i.name = 'Yuna Park' AND s.name = 'Studio A';

-- 2 Miscellaneous (adult + children)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Miscellaneous', 'miscellaneous', cc.id, 'adult', 'Macquarie', i.id, s.id, 60, 20, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'miscellaneous' AND i.name = 'Mei Lin' AND s.name = 'Studio B';

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Miscellaneous', 'miscellaneous', cc.id, 'children', 'Hornsby', i.id, s.id, 60, 18, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'miscellaneous' AND i.name = 'Mei Lin' AND s.name = 'Studio B';

-- 1 Yoga (adult)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Yoga', 'yoga', cc.id, 'adult', 'Hornsby', i.id, s.id, 60, 20, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'yoga' AND i.name = 'Mei Lin' AND s.name = 'Studio A';

-- 1 Pilates (adult)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Pilates', 'pilates', cc.id, 'adult', 'Macquarie', i.id, s.id, 60, 22, false, NULL, NULL, NULL
FROM class_categories cc, instructors i, studios s
WHERE cc.key = 'pilates' AND i.name = 'Mei Lin' AND s.name = 'Studio B';

-- 6) Re-seed class bundles (10-class pass per category)
INSERT INTO class_bundles (category_id, class_count, expiry_weeks, total_price, is_active)
SELECT id, 10, 10, 180, true FROM class_categories;

-- 7) Create mock non-recurring timetable instances for testing
INSERT INTO class_timetable (
  class_id, class_date, start_time, duration_minutes,
  category_id, audience, instructor_id, studio_id, price_per_class,
  max_capacity, current_enrollment, is_active, campus
)
SELECT
  c.id,
  CURRENT_DATE + 1,
  '18:00',
  c.duration_minutes,
  c.category_id,
  c.audience,
  c.instructor_id,
  c.studio_id,
  c.price,
  20,
  0,
  true,
  c.campus
FROM "CLASSES" c
WHERE c.class_type IN ('ballet', 'hip_hop', 'kpop_youth', 'miscellaneous', 'yoga', 'pilates', 'korean_dance', 'chinese_classical');
