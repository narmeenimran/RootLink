-- RootLink: run this entire file once in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS where possible)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ENUMS
DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('male', 'female', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE member_status AS ENUM ('living', 'deceased'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE relationship_type AS ENUM ('spouse', 'parent', 'child', 'sibling'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_type AS ENUM ('birth', 'marriage', 'death', 'graduation', 'reunion', 'anniversary', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('certificate', 'pdf', 'image', 'video', 'letter', 'record', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FAMILY HEADS
CREATE TABLE IF NOT EXISTS family_heads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID,
  parent_head_id UUID REFERENCES family_heads(id) ON DELETE SET NULL,
  parent_member_id UUID,
  generation INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_heads_user ON family_heads(user_id);
CREATE INDEX IF NOT EXISTS idx_family_heads_parent ON family_heads(parent_head_id);

ALTER TABLE family_heads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own family heads" ON family_heads;
CREATE POLICY "Users manage own family heads" ON family_heads FOR ALL USING (auth.uid() = user_id);

-- FAMILY MEMBERS
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_head_id UUID NOT NULL REFERENCES family_heads(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  gender gender_type NOT NULL DEFAULT 'male',
  date_of_birth DATE,
  date_of_death DATE,
  place_of_birth TEXT,
  occupation TEXT,
  biography TEXT,
  profile_image_url TEXT,
  status member_status DEFAULT 'living',
  role TEXT NOT NULL DEFAULT 'head',
  education TEXT,
  notes TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  married_family_head_id UUID REFERENCES family_heads(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_head ON family_members(family_head_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(full_name);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own members" ON family_members;
CREATE POLICY "Users manage own members" ON family_members FOR ALL USING (auth.uid() = user_id);

-- FK constraints (add only if missing)
DO $$ BEGIN
  ALTER TABLE family_heads ADD CONSTRAINT fk_family_heads_member
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE family_heads ADD CONSTRAINT fk_family_heads_parent_member
    FOREIGN KEY (parent_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RELATIONSHIPS
CREATE TABLE IF NOT EXISTS family_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_a_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  member_b_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own relationships" ON family_relationships;
CREATE POLICY "Users manage own relationships" ON family_relationships FOR ALL USING (auth.uid() = user_id);

-- GALLERY
CREATE TABLE IF NOT EXISTS member_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE member_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gallery" ON member_gallery;
CREATE POLICY "Users manage own gallery" ON member_gallery FOR ALL USING (auth.uid() = user_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type event_type NOT NULL DEFAULT 'custom',
  event_date DATE,
  description TEXT,
  location TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own events" ON events;
CREATE POLICY "Users manage own events" ON events FOR ALL USING (auth.uid() = user_id);

-- EVENT MEMBERS
CREATE TABLE IF NOT EXISTS event_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  UNIQUE(event_id, member_id)
);

ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own event members" ON event_members;
CREATE POLICY "Users manage own event members" ON event_members FOR ALL USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type document_type NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own documents" ON documents;
CREATE POLICY "Users manage own documents" ON documents FOR ALL USING (auth.uid() = user_id);

-- MEMORIES
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  memory_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own memories" ON memories;
CREATE POLICY "Users manage own memories" ON memories FOR ALL USING (auth.uid() = user_id);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS family_heads_updated_at ON family_heads;
CREATE TRIGGER family_heads_updated_at BEFORE UPDATE ON family_heads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS family_members_updated_at ON family_members;
CREATE TRIGGER family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done!
SELECT 'RootLink database setup complete!' AS message;
