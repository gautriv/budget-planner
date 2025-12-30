import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMonth(monthString) {
  const [year, month] = monthString.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthOptions(count = 12) {
  const options = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    options.push({ value, label });
  }
  
  return options;
}

export function calculatePercentage(current, total) {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

export function getProgressColor(percentage) {
  if (percentage >= 100) return 'bg-destructive';
  if (percentage >= 80) return 'bg-amber-500';
  return 'bg-primary';
}
