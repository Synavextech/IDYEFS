-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "benefits" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requires_proposal" BOOLEAN DEFAULT FALSE;

-- Create Proposals table
CREATE TABLE IF NOT EXISTS "Proposals" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"("id") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    "autoApproveAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Applications table (Speaker, Sponsor, etc.)
CREATE TABLE IF NOT EXISTS "Applications" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL CHECK (type IN ('SPEAKER', 'SPONSOR', 'NEXTGEN', 'GLOBAL_FORUM')),
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    "description" TEXT NOT NULL,
    "documentUrl" TEXT,
    "donationAmount" DECIMAL(10, 2) DEFAULT 0,
    "paymentStatus" TEXT DEFAULT 'PENDING' CHECK (paymentStatus IN ('PENDING', 'PAID')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- Use DO block to avoid error if policy already exists

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'Proposals'
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;
    END IF;

     IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'Applications'
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE "Applications" ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;


-- Drop existing policies to ensure clean state and avoid conflicts
DROP POLICY IF EXISTS "Users can view their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Users can insert their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can view all proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can update proposals" ON "Proposals";

DROP POLICY IF EXISTS "Users can view their own applications" ON "Applications";
DROP POLICY IF EXISTS "Users can insert their own applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can view all applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can update applications" ON "Applications";

-- Public Access for Event
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON "Event";
CREATE POLICY "Public events are viewable by everyone" ON "Event" FOR SELECT USING (true);


-- Proposals Policies
CREATE POLICY "Users can view their own proposals" ON "Proposals"
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own proposals" ON "Proposals"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Admins can view all proposals" ON "Proposals"
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM "User" WHERE role = 'ADMIN')
    );

CREATE POLICY "Admins can update proposals" ON "Proposals"
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM "User" WHERE role = 'ADMIN')
    );

-- Applications Policies
CREATE POLICY "Users can view their own applications" ON "Applications"
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own applications" ON "Applications"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Admins can view all applications" ON "Applications"
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM "User" WHERE role = 'ADMIN')
    );

CREATE POLICY "Admins can update applications" ON "Applications"
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM "User" WHERE role = 'ADMIN')
    );

-- Storage Buckets (Optional)
-- This usually requires superuser or special privileges in Supabase UI, but here is the SQL attempt
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
