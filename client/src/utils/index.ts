import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export function calculateAge(
  dateOfBirth: string | null,
  dateOfDeath?: string | null
): number | null {
  if (!dateOfBirth) return null;
  const end = dateOfDeath ? new Date(dateOfDeath) : new Date();
  const birth = new Date(dateOfBirth);
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function daysUntilBirthday(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  const nextBirthday = new Date(
    today.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  );
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil(
    (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return labels[gender] ?? gender;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    head: 'Family Head',
    spouse: 'Spouse',
    son: 'Son',
    daughter: 'Daughter',
  };
  return labels[role] ?? role;
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    birth: 'Birth',
    marriage: 'Marriage',
    death: 'Death',
    graduation: 'Graduation',
    reunion: 'Reunion',
    anniversary: 'Anniversary',
    custom: 'Custom',
  };
  return labels[type] ?? type;
}
