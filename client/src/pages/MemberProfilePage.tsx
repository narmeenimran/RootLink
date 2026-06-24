import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Save } from 'lucide-react';
import { familyService } from '@/services/familyService';
import { ProfilePhotoUpload, GalleryUpload } from '@/components/family/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from '@/store/toast';
import {
  calculateAge,
  formatDate,
  getGenderLabel,
  getRoleLabel,
} from '@/utils';

export function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => familyService.getMember(memberId!),
    enabled: !!memberId,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof familyService.updateMember>[1]) =>
      familyService.updateMember(memberId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['family-card'] });
      setEditing(false);
      toast('Profile saved', 'success');
    },
    onError: () => toast('Failed to save profile', 'error'),
  });

  if (isLoading) return <PageLoader />;
  if (!member) {
    return <div className="py-12 text-center text-muted-foreground">Member not found.</div>;
  }

  const age = calculateAge(member.date_of_birth, member.date_of_death);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateMutation.mutate({
      full_name: form.get('full_name') as string,
      preferred_name: (form.get('preferred_name') as string) || null,
      date_of_birth: (form.get('date_of_birth') as string) || null,
      date_of_death: (form.get('date_of_death') as string) || null,
      place_of_birth: (form.get('place_of_birth') as string) || null,
      occupation: (form.get('occupation') as string) || null,
      education: (form.get('education') as string) || null,
      biography: (form.get('biography') as string) || null,
      notes: (form.get('notes') as string) || null,
      phone: (form.get('phone') as string) || null,
      email: (form.get('email') as string) || null,
      address: (form.get('address') as string) || null,
      status: form.get('status') as 'living' | 'deceased',
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/family/${member.family_head_id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{member.full_name}</h1>
          <p className="text-muted-foreground">{getRoleLabel(member.role)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : <><Pencil className="h-4 w-4" /> Edit</>}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-start">
          <ProfilePhotoUpload
            memberId={member.id}
            name={member.full_name}
            currentUrl={member.profile_image_url}
            onUploaded={() =>
              queryClient.invalidateQueries({ queryKey: ['member', memberId] })
            }
          />
          <div className="flex-1 text-center sm:text-left">
            {member.preferred_name && (
              <p className="text-muted-foreground">"{member.preferred_name}"</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3 sm:justify-start text-sm text-muted-foreground">
              <span>{getGenderLabel(member.gender)}</span>
              {age !== null && <span>Age {age}</span>}
              <span className="capitalize">{member.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <Card>
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" defaultValue={member.full_name} required />
                </div>
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input id="preferred_name" name="preferred_name" defaultValue={member.preferred_name ?? ''} />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={member.date_of_birth ?? ''} />
                </div>
                <div>
                  <Label htmlFor="date_of_death">Date of Death</Label>
                  <Input id="date_of_death" name="date_of_death" type="date" defaultValue={member.date_of_death ?? ''} />
                </div>
                <div>
                  <Label htmlFor="place_of_birth">Place of Birth</Label>
                  <Input id="place_of_birth" name="place_of_birth" defaultValue={member.place_of_birth ?? ''} />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" name="occupation" defaultValue={member.occupation ?? ''} />
                </div>
                <div>
                  <Label htmlFor="education">Education</Label>
                  <Input id="education" name="education" defaultValue={member.education ?? ''} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" defaultValue={member.status} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="living">Living</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={member.phone ?? ''} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={member.email ?? ''} />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={member.address ?? ''} />
              </div>
              <div>
                <Label htmlFor="biography">Biography</Label>
                <Textarea id="biography" name="biography" rows={4} defaultValue={member.biography ?? ''} />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} defaultValue={member.notes ?? ''} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <InfoRow label="Date of Birth" value={formatDate(member.date_of_birth)} />
              <InfoRow label="Date of Death" value={formatDate(member.date_of_death)} />
              <InfoRow label="Place of Birth" value={member.place_of_birth} />
              <InfoRow label="Occupation" value={member.occupation} />
              <InfoRow label="Education" value={member.education} />
            </CardContent>
          </Card>

          {(member.phone || member.email || member.address) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                <InfoRow label="Phone" value={member.phone} />
                <InfoRow label="Email" value={member.email} />
                <InfoRow label="Address" value={member.address} />
              </CardContent>
            </Card>
          )}

          {(member.biography || member.notes) && (
            <Card>
              <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                {member.biography && <p>{member.biography}</p>}
                {member.notes && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Notes</p>
                    <p>{member.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {member.gallery && member.gallery.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Photo Gallery</CardTitle>
                <GalleryUpload
                  memberId={member.id}
                  onUploaded={() =>
                    queryClient.invalidateQueries({ queryKey: ['member', memberId] })
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {member.gallery.map((img) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt={img.caption ?? 'Gallery photo'}
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!member.gallery || member.gallery.length === 0) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Photo Gallery</CardTitle>
                <GalleryUpload
                  memberId={member.id}
                  onUploaded={() =>
                    queryClient.invalidateQueries({ queryKey: ['member', memberId] })
                  }
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No photos yet. Add some family memories.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
