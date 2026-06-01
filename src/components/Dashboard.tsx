import { useMemo } from 'react';
import { useStore } from '../store';
import { getDeadlineStatus } from '../utils/deadline';
import {
  Car, CheckCircle, AlertTriangle, Clock,
  Users, BarChart2,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const { vehicles, areas, employees, history } = useStore();

  const stats = useMemo(() => {
    const activeVehicles = vehicles.filter(v => v.status === 'active');
    const completedVehicles = vehicles.filter(v => v.status === 'completed');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = activeVehicles.filter(v => getDeadlineStatus(v) === 'overdue');
    const warning = activeVehicles.filter(v => getDeadlineStatus(v) === 'warning');
    const onTrack = activeVehicles.filter(v => getDeadlineStatus(v) === 'ok');

    // Completed this month
    const thisMonth = completedVehicles.filter(v => {
      if (!v.completedAt) return false;
      const d = new Date(v.completedAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    // Avg completion time
    const avgTime = completedVehicles.length > 0
      ? completedVehicles.reduce((sum, v) => {
          if (!v.completedAt) return sum;
          return sum + (new Date(v.completedAt).getTime() - new Date(v.entryDate).getTime());
        }, 0) / completedVehicles.length
      : 0;
    const avgDays = Math.floor(avgTime / (1000 * 60 * 60 * 24));

    // Vehicles per area
    const byArea = areas.map(a => ({
      area: a,
      count: activeVehicles.filter(v => v.currentAreaId === a.id).length,
    })).sort((a, b) => b.count - a.count);

    // Employees production
    const empProduction = employees.map(emp => {
      const moves = history.filter(h => h.employeeId === emp.id && h.type !== 'created');
      const uniqueVehicles = new Set(moves.map(m => m.vehicleId));
      return {
        employee: emp,
        moves: moves.length,
        vehicles: uniqueVehicles.size,
      };
    }).sort((a, b) => b.moves - a.moves);

    return {
      active: activeVehicles.length,
      completed: completedVehicles.length,
      overdue: overdue.length,
      warning: warning.length,
      onTrack: onTrack.length,
      thisMonth: thisMonth.length,
      avgDays,
      byArea,
      empProduction,
      returned: activeVehicles.filter(v => {
        const area = areas.find(a => a.id === v.currentAreaId);
        return area?.name === 'Retorno';
      }).length,
    };
  }, [vehicles, areas, employees, history]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm">Visão geral da produção</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Car} label="Veículos em Produção" value={stats.active} color="bg-indigo-600" />
        <StatCard icon={CheckCircle} label="Concluídos" value={stats.completed} sub={`${stats.thisMonth} este mês`} color="bg-green-600" />
        <StatCard icon={AlertTriangle} label="Atrasados" value={stats.overdue} color="bg-red-600" />
        <StatCard icon={Clock} label="Tempo Médio" value={`${stats.avgDays}d`} sub="de conclusão" color="bg-purple-600" />
      </div>

      {/* Deadline stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.onTrack}</p>
          <p className="text-sm text-green-300 mt-1">No prazo</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{stats.warning}</p>
          <p className="text-sm text-yellow-300 mt-1">Prazo próximo</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.overdue}</p>
          <p className="text-sm text-red-300 mt-1">Atrasados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicles per area */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Veículos por Setor</h3>
          </div>
          <div className="flex flex-col gap-2">
            {stats.byArea.filter(b => b.count > 0).map(({ area, count }) => {
              const max = Math.max(...stats.byArea.map(b => b.count), 1);
              const pct = (count / max) * 100;
              return (
                <div key={area.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300">{area.name}</span>
                    <span className="text-gray-400 font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: area.color }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.byArea.every(b => b.count === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum veículo em produção</p>
            )}
          </div>
        </div>

        {/* Employee production */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Produção por Funcionário</h3>
          </div>
          <div className="flex flex-col gap-3">
            {stats.empProduction.filter(e => e.moves > 0).map(({ employee, moves, vehicles }) => (
              <div key={employee.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
                  {employee.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{employee.name}</p>
                  <p className="text-gray-500 text-xs">{employee.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-bold">{moves}</p>
                  <p className="text-gray-500 text-xs">{vehicles} veíc.</p>
                </div>
              </div>
            ))}
            {stats.empProduction.every(e => e.moves === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhuma movimentação registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-4 bg-gray-800 border border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Atividade Recente</h3>
        </div>
        <div className="flex flex-col gap-3">
          {useStore.getState().history
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 8)
            .map(h => {
              const vehicle = vehicles.find(v => v.id === h.vehicleId);
              const toArea = areas.find(a => a.id === h.toAreaId);
              const employee = employees.find(e => e.id === h.employeeId);
              if (!vehicle) return null;
              return (
                <div key={h.id} className="flex items-center gap-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium">{vehicle.model} </span>
                    <span className="text-indigo-400 text-xs font-mono">{vehicle.plate}</span>
                    {toArea && <span className="text-gray-400 text-sm"> → {toArea.name}</span>}
                    {employee && <span className="text-gray-500 text-xs"> · {employee.name}</span>}
                  </div>
                  <span className="text-gray-600 text-xs shrink-0">
                    {new Date(h.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              );
            }).filter(Boolean)}
          {useStore.getState().history.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma atividade registrada</p>
          )}
        </div>
      </div>
    </div>
  );
}
