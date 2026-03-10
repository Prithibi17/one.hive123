-- SQL to create the necessary tables in Supabase for OneHive

-- Enable uuid-ossp extension for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the Users table (Updated with avatar_url)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    alt_phone TEXT,
    address TEXT,
    avatar_url TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the Worker Applications table
CREATE TABLE IF NOT EXISTS public.worker_application (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id TEXT UNIQUE NOT NULL,
    from_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    pincode TEXT,
    state TEXT,
    district TEXT,
    address TEXT,
    service TEXT,
    experience INTEGER DEFAULT 0,
    tools TEXT,
    availability TEXT,
    status_level INTEGER DEFAULT 1,
    login_access BOOLEAN DEFAULT FALSE,
    training_slot TEXT,
    other_skills TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the Workers table (Approved Partners)
CREATE TABLE IF NOT EXISTS public.worker (
    id UUID PRIMARY KEY,
    app_id TEXT UNIQUE NOT NULL,
    from_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    pincode TEXT,
    state TEXT,
    district TEXT,
    address TEXT,
    service TEXT,
    experience INTEGER DEFAULT 0,
    tools TEXT,
    availability TEXT,
    login_access BOOLEAN DEFAULT TRUE,
    training_slot TEXT,
    other_skills TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create the Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT REFERENCES public.users(email),
    service_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, completed, cancelled
    worker_id UUID REFERENCES public.worker(id),
    total_price NUMERIC,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Enable all access for anonymous" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable all access for anonymous" ON public.worker_application FOR ALL USING (true);
CREATE POLICY "Enable all access for anonymous" ON public.worker FOR ALL USING (true);
CREATE POLICY "Enable all access for anonymous" ON public.orders FOR ALL USING (true);

-- 4. Create the Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anonymous" ON public.site_settings FOR ALL USING (true);

-- Initialize default hero image
INSERT INTO public.site_settings (key, value)
VALUES ('hero_image_url', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop')
ON CONFLICT (key) DO NOTHING;
