import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Vehicle } from '../types';
import { formatDate, formatDuration } from '../utils/deadline';
import { VehicleDetailModal } from './VehicleDetailModal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  CheckCircle, Search, Filter, Calendar, User,
  Clock, RotateCcw, X, ChevronDown, ChevronUp
} from 'lucide-react';

export function CompletedVehicles() {
  const { vehicles, currentUser, reopenVehicle } = useStore();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEstimator, setFilterEstimator] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'completedAt' | 'entryDate' | 'plate' | 'model'>('completedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const completedVehicles = useMemo(() => {
    let list = vehicles.filter(v => v.status === 'completed');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        (v.clientName?.toLowerCase().includes(q)) ||
        v.estimatorId.toLowerCase().includes(q)
      );
    }

    if (filterEstimator) {
      list = list.filter(v => v.estimatorId.toLowerCase().includes(filterEstimator.toLowerCase()));
    }

    if (filterFromDate) {
      list = list.filter(v => v.completedAt && v.completedAt >= filterFromDate);
    }

    if (filterToDate) {
      list = list.filter(v => v.completedAt && v.completedAt <= filterToDate + 'T23:59:59');
    }

    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      const cmp = valA.localeCompare(valB);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [vehicles, search, filterEstimator, filterFromDate, filterToDate, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleReopen = (v: Vehicle) => {
    if (!window.confirm(`Reabrir veículo ${v.model} (${v.plate})?`)) return;
    reopenVehicle(v.id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            Veículos Concluídos
          </h2>
          <p className="text-gray-400 text-sm mt-1">{completedVehicles.length} veículo(s) encontrado(s)</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-indigo-700 border-indigo-600' : ''}
        >
          <Filter size={14} /> Filtros
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por placa, modelo, cliente ou orçamentista..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Orçamentista"
            value={filterEstimator}
            onChange={e => setFilterEstimator(e.target.value)}
            placeholder="Felipe"
          />
          <Input
            label="Entrega de"
            type="date"
            value={filterFromDate}
            onChange={e => setFilterFromDate(e.target.value)}
          />
          <Input
            label="Entrega até"
            type="date"
            value={filterToDate}
            onChange={e => setFilterToDate(e.target.value)}
          />
          {(filterEstimator || filterFromDate || filterToDate) && (
            <button
              onClick={() => { setFilterEstimator(''); setFilterFromDate(''); setFilterToDate(''); }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 col-span-full"
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-7 gap-3 px-4 py-3 border-b border-gray-700 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <button className="flex items-center gap-1 hover:text-gray-300 text-left" onClick={() => handleSort('plate')}>
            Placa <SortIcon field="plate" />
          </button>
          <button className="flex items-center gap-1 hover:text-gray-300 text-left" onClick={() => handleSort('model')}>
            Modelo <SortIcon field="model" />
          </button>
          <span>Cliente</span>
          <button className="flex items-center gap-1 hover:text-gray-300" onClick={() => handleSort('entryDate')}>
            Entrada <SortIcon field="entryDate" />
          </button>
          <button className="flex items-center gap-1 hover:text-gray-300" onClick={() => handleSort('completedAt')}>
            Entrega <SortIcon field="completedAt" />
          </button>
          <span>Orçamentista</span>
          <span>Tempo</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-700/50">
          {completedVehicles.map(v => (
            <div
              key={v.id}
              className="px-4 py-3.5 hover:bg-gray-750 hover:bg-gray-700/30 transition-colors"
            >
              {/* Mobile layout */}
              <div className="md:hidden">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold">{v.model}</p>
                    <p className="text-indigo-400 font-mono text-sm">{v.plate}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-lg border border-green-800">
                      Concluído
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><User size={10} /> {v.clientName || '-'}</span>
                  <span className="flex items-center gap-1"><User size={10} /> {v.estimatorId}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(v.entryDate)}</span>
                  <span className="flex items-center gap-1"><CheckCircle size={10} /> {formatDate(v.completedAt)}</span>
                  {v.completedAt && (
                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(v.entryDate, v.completedAt)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedVehicle(v); setShowDetail(true); }} className="flex-1">
                    Ver Histórico
                  </Button>
                  {currentUser?.role === 'admin' && (
                    <Button size="sm" variant="ghost" onClick={() => handleReopen(v)} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20">
                      <RotateCcw size={13} /> Reabrir
                    </Button>
                  )}
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-7 gap-3 items-center">
                <span className="text-indigo-400 font-mono text-sm font-bold">{v.plate}</span>
                <div>
                  <p className="text-white text-sm">{v.model}</p>
                  <p className="text-gray-500 text-xs">{v.brand}</p>
                </div>
                <span className="text-gray-300 text-sm truncate">{v.clientName || '-'}</span>
                <span className="text-gray-300 text-sm">{formatDate(v.entryDate)}</span>
                <span className="text-green-400 text-sm">{formatDate(v.completedAt)}</span>
                <span className="text-gray-300 text-sm truncate">{v.estimatorId}</span>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {v.completedAt ? formatDuration(v.entryDate, v.completedAt) : '-'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelectedVehicle(v); setShowDetail(true); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-900/20 transition-colors"
                    >
                      Ver
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleReopen(v)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded-lg hover:bg-yellow-900/20 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {completedVehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-400 font-medium">Nenhum veículo concluído</p>
            <p className="text-gray-600 text-sm mt-1">Veículos entregues aparecerão aqui</p>
          </div>
        )}
      </div>

      <VehicleDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedVehicle(null); }}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
