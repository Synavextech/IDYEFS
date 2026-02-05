-- Youth Empowerment Platform - Consolidated Database Schema & Migration
-- optimized for RLS and missing profile fixes

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-media', 'event-media', true),
  ('user-documents', 'user-documents', false),
  ('documents', 'documents', true),
  ('visa-documents', 'visa-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ENUMS
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. TABLES

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role role DEFAULT 'USER',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS "Event" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    theme TEXT,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    location TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    "imageUrls" TEXT[] DEFAULT '{}',
    activities JSONB DEFAULT '[]',
    alignment JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',
    speakers JSONB DEFAULT '[]',
    journey JSONB DEFAULT '{}',
    faqs JSONB DEFAULT '[]',
    self_funded_seats INTEGER DEFAULT 0,
    partially_funded_seats INTEGER DEFAULT 0,
    fully_funded_seats INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
-- Migration columns for Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "benefits" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requires_proposal" BOOLEAN DEFAULT FALSE;

-- Bookings table
CREATE TABLE IF NOT EXISTS "Booking" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'SELF_FUNDED',
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT NOW()
);
-- Fix: Set default userId to auth.uid() to prevent RLS errors on insert
ALTER TABLE "Booking" ALTER COLUMN "userId" SET DEFAULT auth.uid();

-- BlogPosts table
CREATE TABLE IF NOT EXISTS "BlogPost" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS "Testimonial" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- VisaInvitations table
CREATE TABLE IF NOT EXISTS "VisaInvitation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
ALTER TABLE "VisaInvitation" ADD COLUMN IF NOT EXISTS "letterUrl" TEXT;
ALTER TABLE "VisaInvitation" ALTER COLUMN "userId" SET DEFAULT auth.uid();

-- Notifications table
CREATE TABLE IF NOT EXISTS "Notification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS "Wallet" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stats table
CREATE TABLE IF NOT EXISTS "Stats" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventsAttended" INTEGER DEFAULT 0,
    "blogPostsCount" INTEGER DEFAULT 0,
    "points" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- IdentityVerification table
CREATE TABLE IF NOT EXISTS "IdentityVerification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "documentUrls" TEXT[] DEFAULT '{}',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Proposals table
CREATE TABLE IF NOT EXISTS "Proposals" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"("id") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED')),
    "autoApproveAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "Proposals" ALTER COLUMN "userId" SET DEFAULT auth.uid();

-- Applications table (Sponsors, NextGen, etc.)
CREATE TABLE IF NOT EXISTS "Applications" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL CHECK ("type" IN ('SPEAKER', 'SPONSOR', 'NEXTGEN', 'GLOBAL_FORUM')),
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED')),
    "description" TEXT NOT NULL,
    "documentUrl" TEXT,
    "donationAmount" DECIMAL(10, 2) DEFAULT 0,
    "paymentStatus" TEXT DEFAULT 'PENDING' CHECK ("paymentStatus" IN ('PENDING', 'PAID')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "Applications" ALTER COLUMN "userId" SET DEFAULT auth.uid();


-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_event_date ON "Event"(date);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS idx_booking_event_id ON "Booking"("eventId");
CREATE INDEX IF NOT EXISTS idx_blog_post_author_id ON "BlogPost"("authorId");
CREATE INDEX IF NOT EXISTS idx_testimonial_author_id ON "Testimonial"("authorId");


-- 6. FUNCTIONS & TRIGGERS

-- UpdatedAt Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_updated_at ON "Event";
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON "Event" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_post_updated_at ON "BlogPost";
CREATE TRIGGER update_blog_post_updated_at BEFORE UPDATE ON "BlogPost" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visa_invitation_updated_at ON "VisaInvitation";
CREATE TRIGGER update_visa_invitation_updated_at BEFORE UPDATE ON "VisaInvitation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_updated_at ON "Wallet";
CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON "Wallet" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stats_updated_at ON "Stats";
CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON "Stats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_identity_verification_updated_at ON "IdentityVerification";
CREATE TRIGGER update_identity_verification_updated_at BEFORE UPDATE ON "IdentityVerification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New User Handler Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
    RAISE NOTICE 'Creating user profile for id: %, email: %', NEW.id, NEW.email;

    INSERT INTO public."User" (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, 'USER')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public."Wallet" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public."Stats" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
    
    INSERT INTO public."Notification" ("userId", title, message, type)
    VALUES (NEW.id, 'Welcome to IYDEF!', 'Welcome to our global community!', 'WELCOME');
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. ENABLE RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisaInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdentityVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Applications" ENABLE ROW LEVEL SECURITY;


-- 8. SECURITY HELPER FUNCTION
-- Critical: Uses SECURITY DEFINER to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 9. RLS POLICIES (Clean Recreations)

-- >>> USERS
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Admins can read all users" ON "User";

CREATE POLICY "Users can read own data" ON "User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON "User" FOR SELECT USING (is_admin());

-- >>> EVENTS (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON "Event";
DROP POLICY IF EXISTS "Admins can manage all events" ON "Event";

CREATE POLICY "Public events are viewable by everyone" ON "Event" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all events" ON "Event" FOR ALL USING (is_admin());

-- >>> BOOKINGS (User Own, Admin All)
DROP POLICY IF EXISTS "Users can read own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can insert own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can update own bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can view all bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can update all bookings" ON "Booking";

CREATE POLICY "Users can read own bookings" ON "Booking" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own bookings" ON "Booking" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own bookings" ON "Booking" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all bookings" ON "Booking" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all bookings" ON "Booking" FOR UPDATE USING (is_admin());

-- >>> VISA INVITATIONS
DROP POLICY IF EXISTS "Users can read own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Users can insert own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Users can update own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Admins can view all visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Admins can update all visa invitations" ON "VisaInvitation";

CREATE POLICY "Users can read own visa invitations" ON "VisaInvitation" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own visa invitations" ON "VisaInvitation" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own visa invitations" ON "VisaInvitation" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all visa invitations" ON "VisaInvitation" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all visa invitations" ON "VisaInvitation" FOR UPDATE USING (is_admin());

-- >>> APPLICATIONS (Sponsors/Speakers/etc)
DROP POLICY IF EXISTS "Users can view their own applications" ON "Applications";
DROP POLICY IF EXISTS "Users can insert their own applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can view all applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can update applications" ON "Applications";

CREATE POLICY "Users can view their own applications" ON "Applications" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own applications" ON "Applications" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can view all applications" ON "Applications" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update applications" ON "Applications" FOR UPDATE USING (is_admin());

-- >>> PROPOSALS
DROP POLICY IF EXISTS "Users can view their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Users can insert their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can view all proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can update proposals" ON "Proposals";

CREATE POLICY "Users can view their own proposals" ON "Proposals" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own proposals" ON "Proposals" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can view all proposals" ON "Proposals" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update proposals" ON "Proposals" FOR UPDATE USING (is_admin());

-- >>> OTHER TABLES (Notification, Wallet, Stats, IdentityVerification)
DROP POLICY IF EXISTS "Users can read own notifications" ON "Notification";
DROP POLICY IF EXISTS "Admins can manage all notifications" ON "Notification";
CREATE POLICY "Users can read own notifications" ON "Notification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all notifications" ON "Notification" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own wallet" ON "Wallet";
DROP POLICY IF EXISTS "Admins can manage all wallets" ON "Wallet";
CREATE POLICY "Users can read own wallet" ON "Wallet" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all wallets" ON "Wallet" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own stats" ON "Stats";
DROP POLICY IF EXISTS "Admins can manage all stats" ON "Stats";
CREATE POLICY "Users can read own stats" ON "Stats" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all stats" ON "Stats" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Users can insert own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Admins can manage all identity verifications" ON "IdentityVerification";
CREATE POLICY "Users can read own identity verification" ON "IdentityVerification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own identity verification" ON "IdentityVerification" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can manage all identity verifications" ON "IdentityVerification" FOR ALL USING (is_admin());

-- >>> BLOG & TESTIMONIALS
DROP POLICY IF EXISTS "Blog posts are publicly readable" ON "BlogPost";
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON "BlogPost";
CREATE POLICY "Blog posts are publicly readable" ON "BlogPost" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all blog posts" ON "BlogPost" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Testimonials are publicly readable" ON "Testimonial";
DROP POLICY IF EXISTS "Users can insert own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can update own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can delete own testimonials" ON "Testimonial";
CREATE POLICY "Testimonials are publicly readable" ON "Testimonial" FOR SELECT USING (true);
CREATE POLICY "Users can insert own testimonials" ON "Testimonial" FOR INSERT WITH CHECK (auth.uid() = "authorId");
CREATE POLICY "Users can update own testimonials" ON "Testimonial" FOR UPDATE USING (auth.uid() = "authorId");
CREATE POLICY "Users can delete own testimonials" ON "Testimonial" FOR DELETE USING (auth.uid() = "authorId");

-- >>> STORAGE
-- Consolidate storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to event-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to event-media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to visa-documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to visa-documents" ON storage.objects;

-- 1. Public Read Access for specific buckets
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT
USING ( bucket_id IN ('documents', 'event-media', 'visa-documents') );

-- 2. Authenticated Upload (User can upload to documents, event-media)
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
WITH CHECK ( 
  auth.role() = 'authenticated' AND 
  (bucket_id = 'documents' OR bucket_id = 'event-media')
);

-- 3. Admin Only Upload (Visa Documents)
CREATE POLICY "Admin Upload Visa" ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'visa-documents' AND 
  is_admin()
);


-- 10. CRITICAL DATA FIX
-- Automatically sync missing profiles for existing auth users
DO $$
BEGIN
    INSERT INTO public."User" (id, email, name, role, "createdAt")
    SELECT 
        au.id, 
        au.email, 
        COALESCE(au.raw_user_meta_data->>'name', 'User'),
        'USER',
        au.created_at
    FROM auth.users au
    LEFT JOIN public."User" u ON au.id = u.id
    WHERE u.id IS NULL
    ON CONFLICT (id) DO NOTHING;

    -- Ensure associated records exist
    INSERT INTO public."Wallet" ("userId") 
    SELECT id FROM public."User" WHERE id NOT IN (SELECT "userId" FROM public."Wallet");

    INSERT INTO public."Stats" ("userId") 
    SELECT id FROM public."User" WHERE id NOT IN (SELECT "userId" FROM public."Stats");
END
$$;