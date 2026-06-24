-- Run AFTER creating storage buckets in Supabase Dashboard
-- Buckets needed: profile-images, gallery, memories, events (public), documents (private)

-- PROFILE IMAGES
DROP POLICY IF EXISTS "Users upload own profile images" ON storage.objects;
CREATE POLICY "Users upload own profile images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read profile images" ON storage.objects;
CREATE POLICY "Public read profile images" ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users update own profile images" ON storage.objects;
CREATE POLICY "Users update own profile images" ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own profile images" ON storage.objects;
CREATE POLICY "Users delete own profile images" ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- GALLERY
DROP POLICY IF EXISTS "Users upload own gallery" ON storage.objects;
CREATE POLICY "Users upload own gallery" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read gallery" ON storage.objects;
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Users delete own gallery" ON storage.objects;
CREATE POLICY "Users delete own gallery" ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DOCUMENTS (private)
DROP POLICY IF EXISTS "Users upload own documents" ON storage.objects;
CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users read own documents" ON storage.objects;
CREATE POLICY "Users read own documents" ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own documents" ON storage.objects;
CREATE POLICY "Users delete own documents" ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- MEMORIES
DROP POLICY IF EXISTS "Users upload own memories" ON storage.objects;
CREATE POLICY "Users upload own memories" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read memories" ON storage.objects;
CREATE POLICY "Public read memories" ON storage.objects FOR SELECT
USING (bucket_id = 'memories');

DROP POLICY IF EXISTS "Users delete own memories" ON storage.objects;
CREATE POLICY "Users delete own memories" ON storage.objects FOR DELETE
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- EVENTS
DROP POLICY IF EXISTS "Users upload own events" ON storage.objects;
CREATE POLICY "Users upload own events" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read events" ON storage.objects;
CREATE POLICY "Public read events" ON storage.objects FOR SELECT
USING (bucket_id = 'events');

DROP POLICY IF EXISTS "Users delete own events" ON storage.objects;
CREATE POLICY "Users delete own events" ON storage.objects FOR DELETE
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

SELECT 'Storage policies applied!' AS message;
