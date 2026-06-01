import { Vehicle, DeadlineStatus } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export function getDeadlineStatus(vehicle: Vehicle): DeadlineStatus {
  if (vehicle.status === 'completed') return 'delivered';
  if (!vehicle.promisedDate) return 'ok';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const promised = parseISO(vehicle.promisedDate);
  promised.setHours(0, 0, 0, 0);
  const diff = differenceInDays(promised, today);

  if (diff < 0) return 'overdue';
  if (diff <= 2) return 'warning';
  return 'ok';
}

export function getDeadlineColor(status: DeadlineStatus): string {
  switch (status) {
    case 'ok': return '#22c55e';
    case 'warning': return '#eab308';
    case 'overdue': return '#ef4444';
    case 'delivered': return '#3b82f6';
    default: return '#6b7280';
  }
}

export function getDeadlineBg(status: DeadlineStatus): string {
  switch (status) {
    case 'ok': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'overdue': return 'bg-red-500';
    case 'delivered': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

export function getDeadlineLabel(status: DeadlineStatus): string {
  switch (status) {
    case 'ok': return 'No prazo';
    case 'warning': return 'Prazo próximo';
    case 'overdue': return 'ATRASADO';
    case 'delivered': return 'Entregue';
    default: return '';
  }
}

export function getPriorityScore(vehicle: Vehicle): number {
  const status = getDeadlineStatus(vehicle);
  switch (status) {
    case 'overdue': return 0;
    case 'warning': return 1;
    case 'ok': return 2;
    case 'delivered': return 3;
    default: return 4;
  }
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  } catch {
    return '-';
  }
}

export function formatDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
