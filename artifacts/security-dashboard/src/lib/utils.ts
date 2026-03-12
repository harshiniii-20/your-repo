import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateString: string | undefined | null) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return dateString;
  }
}

export function getRiskColor(level: string | number) {
  if (typeof level === 'number') {
    if (level >= 80) return 'text-destructive';
    if (level >= 50) return 'text-warning';
    if (level >= 20) return 'text-primary';
    return 'text-success';
  }
  
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'high':
    case 'failure':
      return 'text-destructive';
    case 'medium':
    case 'abusive':
    case 'drunk':
    case 'pain':
      return 'text-warning';
    case 'low':
    case 'stressed':
      return 'text-primary';
    case 'success':
    case 'neutral':
      return 'text-success';
    default:
      return 'text-muted-foreground';
  }
}

export function getRiskBgColor(level: string | number) {
  if (typeof level === 'number') {
    if (level >= 80) return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (level >= 50) return 'bg-warning/10 border-warning/30 text-warning';
    if (level >= 20) return 'bg-primary/10 border-primary/30 text-primary';
    return 'bg-success/10 border-success/30 text-success';
  }
  
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'high':
    case 'failure':
      return 'bg-destructive/10 border-destructive/30 text-destructive';
    case 'medium':
    case 'abusive':
    case 'drunk':
    case 'pain':
      return 'bg-warning/10 border-warning/30 text-warning';
    case 'low':
    case 'stressed':
      return 'bg-primary/10 border-primary/30 text-primary';
    case 'success':
    case 'neutral':
      return 'bg-success/10 border-success/30 text-success';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
}
