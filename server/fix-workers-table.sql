-- Run this in your Supabase SQL Editor to fix the 'workers' table schema
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS login_access BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS training_slot TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS expertise TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
