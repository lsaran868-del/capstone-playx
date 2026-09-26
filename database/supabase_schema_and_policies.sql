-- ============================================================================
-- PLAYX — Supabase PostgreSQL Schema, Triggers, and Row Level Security (RLS)
-- Target Platform: Supabase PostgreSQL (lsaran868-playx / xrhlsbsyrzvpznuspqvh)
-- ============================================================================

-- 1. Ensure password nullable in public.users (handled via Supabase Auth)
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;

-- 2. Trigger Function: Auto-confirm user email upon registration
-- Allows instant login without blocking on external SMTP email confirmation
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  new.email_confirmed_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- 3. Trigger Function: Sync auth.users to public.users & grant free subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, avatar, created_at)
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'PlayX Listener'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', new.id::text)),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = COALESCE(EXCLUDED.email, public.users.email),
    role = COALESCE(EXCLUDED.role, public.users.role);

  INSERT INTO public.user_subscriptions (id, user_id, subscription_id, status, starts_at)
  VALUES (
    'usub_' || substr(md5(random()::text), 1, 8),
    new.id::text,
    'sub_free',
    'active',
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on all 12 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies

-- public.users policies
DROP POLICY IF EXISTS "Public can view users" ON public.users;
CREATE POLICY "Public can view users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Service role / admin insert users" ON public.users;
CREATE POLICY "Service role / admin insert users" ON public.users FOR INSERT WITH CHECK (true);

-- Catalog tables (artists, albums, songs, genres, subscriptions): Public read, auth/admin write
DROP POLICY IF EXISTS "Public read artists" ON public.artists;
CREATE POLICY "Public read artists" ON public.artists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage artists" ON public.artists;
CREATE POLICY "Auth manage artists" ON public.artists FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read albums" ON public.albums;
CREATE POLICY "Public read albums" ON public.albums FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage albums" ON public.albums;
CREATE POLICY "Auth manage albums" ON public.albums FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read songs" ON public.songs;
CREATE POLICY "Public read songs" ON public.songs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage songs" ON public.songs;
CREATE POLICY "Auth manage songs" ON public.songs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read genres" ON public.genres;
CREATE POLICY "Public read genres" ON public.genres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage genres" ON public.genres;
CREATE POLICY "Auth manage genres" ON public.genres FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read subscriptions" ON public.subscriptions;
CREATE POLICY "Public read subscriptions" ON public.subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read subscription_features" ON public.subscription_features;
CREATE POLICY "Public read subscription_features" ON public.subscription_features FOR SELECT USING (true);

-- User-scoped tables: playlists, playlist_songs, favorites, listening_history, user_subscriptions
DROP POLICY IF EXISTS "Read playlists" ON public.playlists;
CREATE POLICY "Read playlists" ON public.playlists FOR SELECT USING (is_public = true OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Insert own playlist" ON public.playlists;
CREATE POLICY "Insert own playlist" ON public.playlists FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Update own playlist" ON public.playlists;
CREATE POLICY "Update own playlist" ON public.playlists FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Delete own playlist" ON public.playlists;
CREATE POLICY "Delete own playlist" ON public.playlists FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Read playlist songs" ON public.playlist_songs;
CREATE POLICY "Read playlist songs" ON public.playlist_songs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage playlist songs" ON public.playlist_songs;
CREATE POLICY "Manage playlist songs" ON public.playlist_songs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Read own favorites" ON public.favorites;
CREATE POLICY "Read own favorites" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Insert own favorites" ON public.favorites;
CREATE POLICY "Insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Delete own favorites" ON public.favorites;
CREATE POLICY "Delete own favorites" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Read own history" ON public.listening_history;
CREATE POLICY "Read own history" ON public.listening_history FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Insert own history" ON public.listening_history;
CREATE POLICY "Insert own history" ON public.listening_history FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Read own user subscription" ON public.user_subscriptions;
CREATE POLICY "Read own user subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Manage user subscriptions" ON public.user_subscriptions;
CREATE POLICY "Manage user subscriptions" ON public.user_subscriptions FOR ALL USING (auth.role() = 'authenticated');
