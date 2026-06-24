import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const STORAGE_BUCKETS = {
  profileImages: 'profile-images',
  gallery: 'gallery',
  documents: 'documents',
  memories: 'memories',
  events: 'events',
} as const;

export async function uploadFile(
  bucket: string,
  userId: string,
  entityId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${entityId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split(`/object/public/${bucket}/`);
  if (pathParts[1]) {
    await supabase.storage.from(bucket).remove([pathParts[1]]);
  }
}

export { isSupabaseConfigured };
