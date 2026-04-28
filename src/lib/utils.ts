import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateStatus(status: string | undefined | null) {
  if (!status) return "";
  switch (status) {
    case 'OPEN': return 'Terbuka';
    case 'IN_PROGRESS': return 'Di Proses';
    case 'PENDING': return 'Tertunda';
    case 'RESOLVED': return 'Selesai';
    case 'CLOSED': return 'Ditutup';
    case 'CANCELLED': return 'Dibatalkan';
    default: return status.replace(/_/g, " ");
  }
}
