-- FitQuest Supabase Schema Migration
-- รันใน Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/gvbdjduqfzgsdedgnszj/sql/new

-- ตาราง users
create table if not exists users (
  id text primary key,
  email text,
  name text,
  picture text,
  coins int default 0,
  total_coins_earned int default 0,
  streak int default 0,
  longest_streak int default 0,
  total_workouts int default 0,
  level int default 1,
  weight float,
  height float,
  updated_at timestamptz default now()
);

-- ตาราง workout_logs
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id),
  date text,
  activity text,
  activity_id text,
  duration int,
  distance float,
  calories int,
  coins int,
  bonus text,
  verified boolean,
  image_uri text,
  fraud_score int,
  risk_level text,
  created_at timestamptz default now()
);

-- ตาราง quest_progress
create table if not exists quest_progress (
  user_id text references users(id),
  quest_id text,
  progress float default 0,
  primary key (user_id, quest_id)
);

-- ฟังก์ชัน increment coins (ป้องกัน race condition)
create or replace function increment_coins(uid text, amount int)
returns void as $$
  update users set coins = coins + amount,
    total_coins_earned = total_coins_earned + amount
  where id = uid;
$$ language sql;
