import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${month} ${day}, ${year}, ${hour}:${m} ${ampm}`;
}

export function relativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function interpolateMessage(
  template: string,
  resident: { firstName: string; lastName: string; unit: string }
): string {
  return template
    .replace(/\{\{firstName\}\}/g, resident.firstName)
    .replace(/\{\{lastName\}\}/g, resident.lastName)
    .replace(/\{\{fullName\}\}/g, `${resident.firstName} ${resident.lastName}`)
    .replace(/\{\{unit\}\}/g, resident.unit);
}

export function stripPersonalization(message: string): string {
  return message
    .replace(/\{\{firstName\}\}/g, "")
    .replace(/\{\{lastName\}\}/g, "")
    .replace(/\{\{fullName\}\}/g, "")
    .replace(/\{\{unit\}\}/g, "your unit")
    .trim();
}
