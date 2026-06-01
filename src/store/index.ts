import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { User, Employee, Area, Vehicle, VehicleHistory, VehicleStatus } from '../types';

const DEFAULT_AREAS: Area[] = [
  { id: 'area-1', name: 'Orçamento', order: 0, color: '#6366f1', createdAt: new Date().toISOString() },
  { id: 'area-2', name: 'Desmontagem', order: 1, color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: 'area-3', name: 'Mecânica', order: 2, color: '#ec4899', createdAt: new Date().toISOString() },
  { id: 'area-4', name: 'Lavação', order: 3, color: '#14b8a6', createdAt: new Date().toISOString() },
  { id: 'area-5', name: 'Lataria', order: 4, color: '#f59e0b', createdAt: new Date().toISOString() },
  { id: 'area-6', name: 'Preparação', order: 5, color: '#f97316', createdAt: new Date().toISOString() },
  { id: 'area-7', name: 'Pintura', order: 6, color: '#ef4444', createdAt: new Date().toISOString() },
  { id: 'area-8', name: 'Polimento', order: 7, color: '#06b6d4', createdAt: new Date().toISOString() },
  { id: 'area-9', name: 'Retoque', order: 8, color: '#84cc16', createdAt: new Date().toISOString() },
  { id: 'area-10', name: 'Martelinho de Ouro', order: 9, color: '#eab308', createdAt: new Date().toISOString() },
  { id: 'area-11', name: 'Retorno', order: 10, color: '#64748b', createdAt: new Date().toISOString() },
  { id: 'area-12', name: 'Entregue', order: 11, color: '#22c55e', createdAt: new Date().toISOString() },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Roberto', role: 'Mecânico', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-2', name: 'Cleomar', role: 'Lateiro', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-3', name: 'Tiago', role: 'Preparador', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-4', name: 'Fabiano', role: 'Pintor', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-5', name: 'Adriano', role: 'Polidor', active: true, createdAt: new Date().toISOString() },
];

const DEFAULT_ADMIN: User = {
  id: 'user-admin',
  name: 'Administrador',
  email: 'admin@oficina.com',
  password: 'admin123',
  role: 'admin',
  active: true,
  createdAt: new Date().toISOString(),
};

const DEFAULT_USER: User = {
  id: 'user-1',
  name: 'Felipe',
  email: 'felipe@oficina.com',
  password: '123456',
  role: 'user',
  active: true,
  createdAt: new Date().toISOString(),
};

function loadState<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultValue;
}

function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

interface AppState {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Areas
  areas: Area[];
  addArea: (area: Omit<Area, 'id' | 'createdAt'>) => void;
  updateArea: (id: string, data: Partial<Area>) => void;
  deleteArea: (id: string) => void;
  reorderAreas: (areas: Area[]) => void;

  // Vehicles
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  moveVehicle: (vehicleId: string, toAreaId: string, employeeId?: string) => void;
  completeVehicle: (vehicleId: string, employeeId?: string) => void;
  reopenVehicle: (vehicleId: string) => void;

  // History
  history: VehicleHistory[];
  getVehicleHistory: (vehicleId: string) => VehicleHistory[];

  // Search/Filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterEmployeeId: string;
  setFilterEmployeeId: (id: string) => void;
  filterAreaId: string;
  setFilterAreaId: (id: string) => void;

  // UI
  activeView: 'kanban' | 'dashboard' | 'completed' | 'employees' | 'areas' | 'users' | 'settings';
  setActiveView: (view: AppState['activeView']) => void;
}

export const useStore = create<AppState>((set, get) => {
  const initialUsers = loadState<User[]>('ws_users', [DEFAULT_ADMIN, DEFAULT_USER]);
  const initialEmployees = loadState<Employee[]>('ws_employees', DEFAULT_EMPLOYEES);
  const initialAreas = loadState<Area[]>('ws_areas', DEFAULT_AREAS);
  const initialVehicles = loadState<Vehicle[]>('ws_vehicles', []);
  const initialHistory = loadState<VehicleHistory[]>('ws_history', []);

  return {
    currentUser: null,
    searchQuery: '',
    filterEmployeeId: '',
    filterAreaId: '',
    activeView: 'kanban',

    users: initialUsers,
    employees: initialEmployees,
    areas: initialAreas,
    vehicles: initialVehicles,
    history: initialHistory,

    login: (email, password) => {
      const user = get().users.find(u => u.email === email && u.password === password && u.active);
      if (user) {
        set({ currentUser: user });
        return true;
      }
      return false;
    },

    logout: () => set({ currentUser: null }),

    addUser: (userData) => {
      const newUser: User = { ...userData, id: uuidv4(), createdAt: new Date().toISOString() };
      const users = [...get().users, newUser];
      set({ users });
      saveState('ws_users', users);
    },

    updateUser: (id, data) => {
      const users = get().users.map(u => u.id === id ? { ...u, ...data } : u);
      set({ users });
      saveState('ws_users', users);
      // Update currentUser if editing self
      if (get().currentUser?.id === id) {
        set({ currentUser: { ...get().currentUser!, ...data } });
      }
    },

    deleteUser: (id) => {
      const users = get().users.filter(u => u.id !== id);
      set({ users });
      saveState('ws_users', users);
    },

    addEmployee: (empData) => {
      const newEmp: Employee = { ...empData, id: uuidv4(), createdAt: new Date().toISOString() };
      const employees = [...get().employees, newEmp];
      set({ employees });
      saveState('ws_employees', employees);
    },

    updateEmployee: (id, data) => {
      const employees = get().employees.map(e => e.id === id ? { ...e, ...data } : e);
      set({ employees });
      saveState('ws_employees', employees);
    },

    deleteEmployee: (id) => {
      const employees = get().employees.filter(e => e.id !== id);
      set({ employees });
      saveState('ws_employees', employees);
    },

    addArea: (areaData) => {
      const newArea: Area = { ...areaData, id: uuidv4(), createdAt: new Date().toISOString() };
      const areas = [...get().areas, newArea].sort((a, b) => a.order - b.order);
      set({ areas });
      saveState('ws_areas', areas);
    },

    updateArea: (id, data) => {
      const areas = get().areas.map(a => a.id === id ? { ...a, ...data } : a);
      set({ areas });
      saveState('ws_areas', areas);
    },

    deleteArea: (id) => {
      const areas = get().areas.filter(a => a.id !== id);
      set({ areas });
      saveState('ws_areas', areas);
    },

    reorderAreas: (areas) => {
      set({ areas });
      saveState('ws_areas', areas);
    },

    addVehicle: (vehicleData) => {
      const now = new Date().toISOString();
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: uuidv4(),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      const vehicles = [...get().vehicles, newVehicle];
      set({ vehicles });
      saveState('ws_vehicles', vehicles);

      // Add history
      const histEntry: VehicleHistory = {
        id: uuidv4(),
        vehicleId: newVehicle.id,
        type: 'created',
        toAreaId: vehicleData.currentAreaId,
        userId: vehicleData.createdByUserId,
        timestamp: now,
      };
      const history = [...get().history, histEntry];
      set({ history });
      saveState('ws_history', history);
    },

    updateVehicle: (id, data) => {
      const now = new Date().toISOString();
      const vehicles = get().vehicles.map(v => v.id === id ? { ...v, ...data, updatedAt: now } : v);
      set({ vehicles });
      saveState('ws_vehicles', vehicles);

      // History for edit
      const histEntry: VehicleHistory = {
        id: uuidv4(),
        vehicleId: id,
        type: 'edited',
        userId: get().currentUser?.id || '',
        timestamp: now,
      };
      const history = [...get().history, histEntry];
      set({ history });
      saveState('ws_history', history);
    },

    moveVehicle: (vehicleId, toAreaId, employeeId) => {
      const now = new Date().toISOString();
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const deliveredArea = get().areas.find(a => a.name === 'Entregue');
      const isCompleting = deliveredArea && toAreaId === deliveredArea.id;

      const vehicles = get().vehicles.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              currentAreaId: toAreaId,
              updatedAt: now,
              status: isCompleting ? ('completed' as VehicleStatus) : v.status,
              completedAt: isCompleting ? now : v.completedAt,
              completedByUserId: isCompleting ? (get().currentUser?.id || '') : v.completedByUserId,
            }
          : v
      );
      set({ vehicles });
      saveState('ws_vehicles', vehicles);

      const histEntry: VehicleHistory = {
        id: uuidv4(),
        vehicleId,
        type: isCompleting ? 'completed' : 'moved',
        fromAreaId: vehicle.currentAreaId,
        toAreaId,
        employeeId,
        userId: get().currentUser?.id || '',
        timestamp: now,
      };
      const history = [...get().history, histEntry];
      set({ history });
      saveState('ws_history', history);
    },

    completeVehicle: (vehicleId, employeeId) => {
      const deliveredArea = get().areas.find(a => a.name === 'Entregue');
      if (deliveredArea) {
        get().moveVehicle(vehicleId, deliveredArea.id, employeeId);
      }
    },

    reopenVehicle: (vehicleId) => {
      const now = new Date().toISOString();
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      // Find last non-delivered area from history
      const vHistory = get().history
        .filter(h => h.vehicleId === vehicleId && h.type === 'moved')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const deliveredArea = get().areas.find(a => a.name === 'Entregue');
      const lastArea = vHistory.find(h => h.fromAreaId && h.fromAreaId !== deliveredArea?.id);
      const returnAreaId = lastArea?.fromAreaId || get().areas[0]?.id;

      const vehicles = get().vehicles.map(v =>
        v.id === vehicleId
          ? { ...v, status: 'active' as VehicleStatus, completedAt: undefined, completedByUserId: undefined, currentAreaId: returnAreaId, updatedAt: now }
          : v
      );
      set({ vehicles });
      saveState('ws_vehicles', vehicles);

      const histEntry: VehicleHistory = {
        id: uuidv4(),
        vehicleId,
        type: 'reopened',
        toAreaId: returnAreaId,
        userId: get().currentUser?.id || '',
        timestamp: now,
        notes: 'Veículo reaberto pelo administrador',
      };
      const history = [...get().history, histEntry];
      set({ history });
      saveState('ws_history', history);
    },

    getVehicleHistory: (vehicleId) => {
      return get().history.filter(h => h.vehicleId === vehicleId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
    setFilterEmployeeId: (id) => set({ filterEmployeeId: id }),
    setFilterAreaId: (id) => set({ filterAreaId: id }),
    setActiveView: (view) => set({ activeView: view }),
  };
});
