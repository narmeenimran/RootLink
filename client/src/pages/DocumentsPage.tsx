import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import { documentService } from '@/services/familyService';
import { useAuth } from '@/hooks/useAuth';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { PageLoader, EmptyState } from '@/components/ui/spinner';
import type { DocumentType } from '@/types';

export function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: documentService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const file = form.get('file') as File;
    if (!file?.size) return;

    setUploading(true);
    try {
      const url = await uploadFile(STORAGE_BUCKETS.documents, user.id, 'docs', file);
      await documentService.create({
        title: form.get('title') as string,
        document_type: form.get('document_type') as DocumentType,
        file_url: url,
        file_name: file.name,
        file_size: file.size,
        description: (form.get('description') as string) || null,
        member_id: null,
        event_id: null,
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUpload(false);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Certificates, records, letters, and archives</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4" /> Upload
        </Button>
      </div>

      {!documents?.length ? (
        <EmptyState
          title="No documents yet"
          description="Upload certificates, PDFs, images, videos, and historical records."
          action={<Button onClick={() => setShowUpload(true)}><Plus className="h-4 w-4" /> Upload Document</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs capitalize text-muted-foreground">{doc.document_type}</p>
                {doc.description && <p className="mt-2 text-sm">{doc.description}</p>}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('Delete this document?')) deleteMutation.mutate(doc.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in zoom-in-95">
            <CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="document_type">Type</Label>
                  <select id="document_type" name="document_type" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                    {['certificate', 'pdf', 'image', 'video', 'letter', 'record', 'other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <div>
                  <Label htmlFor="file">File *</Label>
                  <Input id="file" name="file" type="file" required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
