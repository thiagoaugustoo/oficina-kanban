import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { User, Employee, Area, Vehicle, VehicleHistory, VehicleStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_AREAS: Area[] = [
  { id: 'area-1', name: 'Orçamento', displayOrder: 0, color: '#6366f1', createdAt: new Date().toISOString() },
  { id: 'area-2', name: 'Desmontagem', displayOrder: 1, color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: 'area-3', name: 'Mecânica', displayOrder: 2, color: '#ec4899', createdAt: new Date().toISOString() },
  { id: 'area-4', name: 'Lavação', displayOrder: 3, color: '#14b8a6', createdAt: new Date().toISOString() },
  { id: 'area-5', name: 'Lataria', displayOrder: 4, color: '#f59e0b', createdAt: new Date().toISOString() },
  { id: 'area-6', name: 'Preparação', displayOrder: 5, color: '#f97316', createdAt: new Date().toISOString() },
  { id: 'area-7', name: 'Pintura', displayOrder: 6, color: '#ef4444', createdAt: new Date().toISOString() },
  { id: 'area-8', name: 'Polimento', displayOrder: 7, color: '#06b6d4', createdAt: new Date().toISOString() },
  { id: 'area-9', name: 'Retoque', displayOrder: 8, color: '#84cc16', createdAt: new Date().toISOString() },
  { id: 'area-10', name: 'Martelinho de Ouro', displayOrder: 9, color: '#eab308', createdAt: new Date().toISOString() },
  { id: 'area-11', name: 'Retorno', displayOrder: 10, color: '#64748b', createdAt: new Date().toISOString() },
  { id: 'area-12', name: 'Pronto para Entrega', displayOrder: 11, color: '#06b6d4', createdAt: new Date().toISOString() },
  { id: 'area-13', name: 'Entregue', displayOrder: 12, color: '#22c55e', createdAt: new Date().toISOString() },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Roberto', role: 'Mecânico', areaId: 'area-3', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-2', name: 'Cleomar', role: 'Lateiro', areaId: 'area-5', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-3', name: 'Tiago', role: 'Preparador', areaId: 'area-6', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-4', name: 'Fabiano', role: 'Pintor', areaId: 'area-7', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-5', name: 'Adriano', role: 'Polidor', areaId: 'area-8', active: true, createdAt: new Date().toISOString() },
  { id: 'emp-6', name: 'Felipe', role: 'Orçamentista', isEstimator: true, active: true, createdAt: new Date().toISOString() },
];

const DEFAULT_USERS: User[] = [];

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createAccount: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateUser: (id: string, data: Partial<User>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message: string }>;

  // Employees
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<{ success: boolean; message: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; message: string }>;

  // Areas
  areas: Area[];
  addArea: (area: Omit<Area, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateArea: (id: string, data: Partial<Area>) => Promise<{ success: boolean; message: string }>;
  deleteArea: (id: string) => Promise<{ success: boolean; message: string }>;
  reorderAreas: (areas: Area[]) => Promise<{ success: boolean; message: string }>;

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
  const initialUsers = loadState<User[]>('ws_users', DEFAULT_USERS);
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

    login: async (email, password) => {
      const cleanedIdentifier = email.trim();
      const localUser = get().users.find(u => u.email.toLowerCase() === cleanedIdentifier.toLowerCase() || u.username?.toLowerCase() === cleanedIdentifier.toLowerCase());
      const resolvedEmail = localUser?.email || cleanedIdentifier;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
        if (error || !data.session?.user) {
          console.error('Supabase login failed:', error?.message);
          return false;
        }

       /* const profile = await fetchUserProfileByEmail(resolvedEmail);
        if (profile && profile.active) {
          set({ currentUser: profile });
          return true;
        }
          */

        let profile = await fetchUserProfileByEmail(resolvedEmail);

          if (!profile && data.user) {
            profile = {
              id: data.user.id,
              name: data.user.user_metadata?.name || '',
              username: resolvedEmail.split('@')[0],
              email: resolvedEmail,
              password: '',
              role: 'admin',
              active: true,
              createdAt: new Date().toISOString()
            };

            await supabase.from('users').upsert([profile]);
          }

if (profile?.active) {
  set({ currentUser: profile });
  return true;
}

        if (data.user) {
          const fallbackUser: User = {
            id: data.user.id,
            name: (data.user.user_metadata as any)?.name || data.user.email || 'Usuário',
            username: (data.user.user_metadata as any)?.username || data.user.email?.split('@')[0] || '',
            email: data.user.email || resolvedEmail,
            password: '',
            role: 'user',
            active: true,
            createdAt: new Date().toISOString(),
          };

          const users = get().users.some(u => u.id === fallbackUser.id || u.email === fallbackUser.email)
            ? get().users
            : [...get().users, fallbackUser];

          set({ currentUser: fallbackUser, users });
          saveState('ws_users', users);
          return true;
        }

        await supabase.auth.signOut();
        return false;
      }

      const user = localUser && localUser.password === password && localUser.active ? localUser : undefined;
      if (user) {
        set({ currentUser: user });
        return true;
      }
      return false;
    },

    logout: async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      set({ currentUser: null });
    },

    createAccount: async (name, email, password) => {
      const existingUser = get().users.find(u => u.email === email);
      if (existingUser) {
        return { success: false, message: 'Já existe um usuário com este e-mail.' };
      }

      const username = email.split('@')[0];
      const newUser: User = {
        id: uuidv4(),
        name,
        username,
        email,
        password,
        role: 'user',
        isEstimator: false,
        active: true,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) {
          console.error('Supabase sign-up failed:', error.message);
          return { success: false, message: error.message };
        }

                if (data.user) {
          return {
            success: true,
            message: 'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.'
          };
        }

        const users = get().users.some(u => u.id === profile.id || u.email === profile.email)
          ? get().users
          : [...get().users, profile];

        set({ users });
        saveState('ws_users', users);

        if (data.user) {
          set({ currentUser: profile });
        }

        return { success: true, message: 'Conta criada com sucesso. Verifique seu e-mail para confirmar o login.' };
      }

      const users = [...get().users, newUser];
      set({ users, currentUser: newUser });
      saveState('ws_users', users);
      return { success: true, message: 'Conta criada com sucesso. Agora você está logado.' };
    },

    resetPassword: async (email, newPassword) => {
      const user = get().users.find(u => u.email === email);
      if (!user) {
        return { success: false, message: 'E-mail não encontrado.' };
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          console.error('Supabase reset password failed:', error.message);
          return { success: false, message: error.message };
        }
        return { success: true, message: 'Link de redefinição enviado para o e-mail.' };
      }

      if (!newPassword) {
        return { success: false, message: 'Informe uma nova senha para redefinir localmente.' };
      }

      updateUser(user.id, { password: newPassword });
      return { success: true, message: 'Senha redefinida com sucesso.' };
    },

    addUser: async (userData) => {
      try {
        const newUser: User = { ...userData, id: uuidv4(), createdAt: new Date().toISOString() };
        const users = [...get().users, newUser];
        set({ users });
        saveState('ws_users', users);
        
        const result = await upsertRemote('users', [newUser]);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Usuário criado com sucesso' };
      } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao adicionar usuário' };
      }
    },

    updateUser: async (id, data) => {
      try {
        const users = get().users.map(u => u.id === id ? { ...u, ...data } : u);
        set({ users });
        saveState('ws_users', users);
        
        if (get().currentUser?.id === id) {
          set({ currentUser: { ...get().currentUser!, ...data } });
        }
        
        const result = await upsertRemote('users', users.filter(u => u.id === id));
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Usuário atualizado com sucesso' };
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao atualizar usuário' };
      }
    },

    deleteUser: async (id) => {
      try {
        const users = get().users.filter(u => u.id !== id);
        set({ users });
        saveState('ws_users', users);
        
        const result = await deleteRemote('users', id);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Usuário deletado com sucesso' };
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao deletar usuário' };
      }
    },

    addEmployee: async (empData) => {
      try {
        const newEmp: Employee = { ...empData, id: uuidv4(), createdAt: new Date().toISOString() };
        const employees = [...get().employees, newEmp];
        set({ employees });
        saveState('ws_employees', employees);
        
        const result = await upsertRemote('employees', [newEmp]);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Funcionário criado com sucesso' };
      } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao adicionar funcionário' };
      }
    },

    updateEmployee: async (id, data) => {
      try {
        const employees = get().employees.map(e => e.id === id ? { ...e, ...data } : e);
        set({ employees });
        saveState('ws_employees', employees);
        
        const result = await upsertRemote('employees', employees.filter(e => e.id === id));
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Funcionário atualizado com sucesso' };
      } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao atualizar funcionário' };
      }
    },

    deleteEmployee: async (id) => {
      try {
        const employees = get().employees.filter(e => e.id !== id);
        set({ employees });
        saveState('ws_employees', employees);
        
        const result = await deleteRemote('employees', id);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao sincronizar com Supabase');
        }
        
        return { success: true, message: 'Funcionário deletado com sucesso' };
      } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao deletar funcionário' };
      }
    },

    // Areas
addArea: async (areaData) => {
  try {
    const newArea: Area = { 
      ...areaData, 
      id: uuidv4(), 
      createdAt: new Date().toISOString() 
    };
    
    // IMPORTANTE: Aguarda o upsert ANTES de atualizar o estado local
    const result = await upsertRemote('areas', [newArea]);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao sincronizar com Supabase');
    }
    
    // Só atualiza o estado local após confirmar que salvou no Supabase
    const areas = [...get().areas, newArea].sort((a, b) => a.displayOrder - b.displayOrder);
    set({ areas });
    saveState('ws_areas', areas);
    
    return { success: true, message: 'Área criada com sucesso' };
  } catch (error) {
    console.error('Erro ao adicionar área:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao adicionar área' 
    };
  }
},

updateArea: async (id, data) => {
  try {
    const areas = get().areas.map(a => a.id === id ? { ...a, ...data } : a);
    set({ areas });
    saveState('ws_areas', areas);
    
    const result = await upsertRemote('areas', areas.filter(a => a.id === id));
    if (!result.success) {
      throw new Error(result.error || 'Erro ao sincronizar com Supabase');
    }
    
    return { success: true, message: 'Área atualizada com sucesso' };
  } catch (error) {
    console.error('Erro ao atualizar área:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao atualizar área' 
    };
  }
},

deleteArea: async (id) => {
  try {
    // Verificar se existem funcionários ou veículos vinculados a esta área
    const hasEmployees = get().employees.some(e => e.areaId === id);
    const hasVehicles = get().vehicles.some(v => v.currentAreaId === id);
    
    if (hasEmployees || hasVehicles) {
      return { 
        success: false, 
        message: 'Não é possível excluir esta área pois existem funcionários ou veículos vinculados a ela.' 
      };
    }
    
    const areas = get().areas.filter(a => a.id !== id);
    set({ areas });
    saveState('ws_areas', areas);
    
    const result = await deleteRemote('areas', id);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao sincronizar com Supabase');
    }
    
    return { success: true, message: 'Área deletada com sucesso' };
  } catch (error) {
    console.error('Erro ao deletar área:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao deletar área' 
    };
  }
},

reorderAreas: async (areas) => {
  try {
    set({ areas });
    saveState('ws_areas', areas);
    
    const result = await upsertRemote('areas', areas);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao sincronizar com Supabase');
    }
    
    return { success: true, message: 'Áreas reordenadas com sucesso' };
  } catch (error) {
    console.error('Erro ao reordenar áreas:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao reordenar áreas' 
    };
  }
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

      void upsertRemote('vehicles', [newVehicle]);
      void upsertRemote('history', [histEntry]);
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

      const updatedVehicle = vehicles.find(v => v.id === id);
      if (updatedVehicle) {
        void upsertRemote('vehicles', [updatedVehicle]);
      }
      void upsertRemote('history', [histEntry]);
    },

    moveVehicle: (vehicleId, toAreaId, employeeId) => {
      const now = new Date().toISOString();
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const readyArea = get().areas.find(a => a.name === 'Pronto para Entrega');
      const deliveredArea = get().areas.find(a => a.name === 'Entregue');
      
      // Se moveu para "Pronto para Entrega", automaticamente move para "Entregue"
      const finalAreaId = (readyArea && toAreaId === readyArea.id) ? (deliveredArea?.id || toAreaId) : toAreaId;
      const isCompleting = deliveredArea && finalAreaId === deliveredArea.id;

      const vehicles = get().vehicles.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              currentAreaId: finalAreaId,
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
        toAreaId: finalAreaId,
        employeeId,
        userId: get().currentUser?.id || '',
        timestamp: now,
      };
      const history = [...get().history, histEntry];
      set({ history });
      saveState('ws_history', history);

      const updatedVehicle = vehicles.find(v => v.id === vehicleId);
      if (updatedVehicle) {
        void upsertRemote('vehicles', [updatedVehicle]);
      }
      void upsertRemote('history', [histEntry]);
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

      const updatedVehicle = vehicles.find(v => v.id === vehicleId);
      if (updatedVehicle) {
        void upsertRemote('vehicles', [updatedVehicle]);
      }
      void upsertRemote('history', [histEntry]);
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
async function fetchRemoteTable<T>(table: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from<T>(table).select('*');
  if (error) {
    console.error(`Supabase fetch failed for ${table}:`, error.message);
    return null;
  }
  return data;
}

let isUpdating = false;

async function upsertRemote<T>(table: string, rows: T[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || rows.length === 0) {
    return { success: !isSupabaseConfigured, error: !isSupabaseConfigured ? undefined : 'Supabase não configurado' };
  }
  
  try {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error(`Supabase upsert failed for ${table}:`, error.message);
      return { success: false, error: error.message };
    }
    
    // Aguarda um pouco para garantir que o Supabase processou
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`Error upserting to ${table}:`, message);
    return { success: false, error: message };
  }
}

async function deleteRemote(table: string, id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }
  
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Supabase delete failed for ${table}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`Error deleting from ${table}:`, message);
    return { success: false, error: message };
  }
}



async function fetchUserProfileByEmail(email: string) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from<User>('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Failed to load user profile:', error.message);
    return null;
  }

  return data;
}

async function refreshRemoteState() {
  if (!isSupabaseConfigured ) return;

  const [users, employees, areas, vehicles, history] = await Promise.all([
    fetchRemoteTable<User>('users'),
    fetchRemoteTable<Employee>('employees'),
    fetchRemoteTable<Area>('areas'),
    fetchRemoteTable<Vehicle>('vehicles'),
    fetchRemoteTable<VehicleHistory>('history'),
  ]);

  const currentState = useStore.getState();

  if (users && JSON.stringify(users) !== JSON.stringify(currentState.users)) {
    useStore.setState({ users });
    saveState('ws_users', users);
  }
  if (employees && JSON.stringify(employees) !== JSON.stringify(currentState.employees)) {
    useStore.setState({ employees });
    saveState('ws_employees', employees);
  }
  if (areas && JSON.stringify(areas) !== JSON.stringify(currentState.areas)) {
    useStore.setState({ areas });
    saveState('ws_areas', areas);
  }
  if (vehicles && JSON.stringify(vehicles) !== JSON.stringify(currentState.vehicles)) {
    useStore.setState({ vehicles });
    saveState('ws_vehicles', vehicles);
  }
  if (history && JSON.stringify(history) !== JSON.stringify(currentState.history)) {
    useStore.setState({ history });
    saveState('ws_history', history);
  }
}

function subscribeToRemoteChanges() {
  if (!isSupabaseConfigured) return;

  const channel = supabase.channel('realtime-sync');
  const tables = ['users', 'employees', 'areas', 'vehicles', 'history'];

  tables.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      refreshRemoteState();
    });
  });

  channel.subscribe(status => {
    if (status?.error) {
      console.error('Supabase realtime subscription error:', status.error.message);
    }
  });
}

export async function initSupabaseSync() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Remote sync disabled.');
    return;
  }

  await refreshRemoteState();
  subscribeToRemoteChanges();
  subscribeToAuthChanges();
  await loadCurrentSession();
}

async function loadCurrentSession() {
  if (!isSupabaseConfigured) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to get auth session:', error.message);
    return;
  }

  const email = data.session?.user?.email;
  if (email) {
    const profile = await fetchUserProfileByEmail(email);
    if (profile && profile.active) {
      useStore.setState({ currentUser: profile });
    } else {
      await supabase.auth.signOut();
      useStore.setState({ currentUser: null });
    }
  }
}

function subscribeToAuthChanges() {
  if (!isSupabaseConfigured) return;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const email = session?.user?.email;
    if (!email) {
      useStore.setState({ currentUser: null });
      return;
    }

    const profile = await fetchUserProfileByEmail(email);
    if (profile && profile.active) {
      useStore.setState({ currentUser: profile });
    } else {
      await supabase.auth.signOut();
      useStore.setState({ currentUser: null });
    }
  });
}