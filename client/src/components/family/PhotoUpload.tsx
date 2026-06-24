import { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import { familyService } from '@/services/familyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/store/toast';

interface ProfilePhotoUploadProps {
  memberId: string;
  name: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

export function ProfilePhotoUpload({
  memberId,
  name,
  currentUrl,
  onUploaded,
}: ProfilePhotoUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadFile(
        STORAGE_BUCKETS.profileImages,
        user.id,
        memberId,
        file
      );
      await familyService.updateMember(memberId, { profile_image_url: url });
      onUploaded(url);
      toast('Profile photo updated', 'success');
    } catch {
      toast('Failed to upload photo. Check storage bucket setup.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <Avatar className="h-28 w-28 ring-4 ring-primary/20">
        <AvatarImage src={currentUrl ?? undefined} />
        <AvatarFallback name={name} className="text-2xl" />
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

interface GalleryUploadProps {
  memberId: string;
  onUploaded: () => void;
}

export function GalleryUpload({ memberId, onUploaded }: GalleryUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(STORAGE_BUCKETS.gallery, user.id, memberId, file);
        await familyService.addGalleryImage(memberId, url);
      }
      onUploaded();
      toast('Photos added to gallery', 'success');
    } catch {
      toast('Failed to upload gallery photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading...' : 'Add Photos'}
      </Button>
    </>
  );
}
