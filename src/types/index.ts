export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  active: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  areaId?: string;
  isEstimator?: boolean;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Area {
  id: string;
  name: string;
  order: number;
  color?: string;
  createdAt: string;
}

export type VehicleStatus = 'active' | 'completed' | 'archived';
export type DeadlineStatus = 'ok' | 'warning' | 'overdue' | 'delivered';

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color?: string;
  clientName?: string;
  observations?: string;
  entryDate: string;
  promisedDate?: string;
  estimatorId: string;
  currentAreaId: string;
  status: VehicleStatus;
  completedAt?: string;
  completedByUserId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleHistory {
  id: string;
  vehicleId: string;
  type: 'created' | 'moved' | 'completed' | 'reopened' | 'edited';
  fromAreaId?: string;
  toAreaId?: string;
  employeeId?: string;
  userId: string;
  notes?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'overdue' | 'warning' | 'stale';
  vehicleId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
