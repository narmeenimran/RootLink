# Supabase Storage Setup

Create these buckets in **Supabase Dashboard → Storage → New bucket**:

| Bucket           | Public | Purpose                          |
|------------------|--------|----------------------------------|
| `profile-images` | Yes    | Member profile photos            |
| `gallery`        | Yes    | Member image galleries           |
| `documents`      | No     | PDFs, certificates, letters      |
| `memories`       | Yes    | Memory/story photos              |
| `events`         | Yes    | Event cover and gallery photos   |

## Storage Policies (SQL)

Run after creating buckets:

```sql
-- Profile images: authenticated users upload to own folder
CREATE POLICY "Users upload own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Gallery
CREATE POLICY "Users upload own gallery"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Documents (private)
CREATE POLICY "Users upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Memories
CREATE POLICY "Users upload own memories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read memories"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories');

-- Events
CREATE POLICY "Users upload own events"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read events"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');
```

## File path convention

```
{bucket}/{user_id}/{entity_id}/{filename}
```

Example: `profile-images/abc-123/member-456/photo.jpg`
