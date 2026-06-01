import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../store';
import { Vehicle, Area } from '../types';
import { VehicleCard, VehicleCardOverlay } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { MoveVehicleModal } from './MoveVehicleModal';
import { VehicleModal } from './VehicleModal';
import { getPriorityScore } from '../utils/deadline';
import { Plus, Search, Filter, Bell, X } from 'lucide-react';
import { Button } from './ui/Button';
import { useAlerts } from '../hooks/useAlerts';

interface KanbanColumnProps {
  area: Area;
  vehicles: Vehicle[];
  onVehicleClick: (v: Vehicle) => void;
  onAddVehicle: (areaId: string) => void;
}

function KanbanColumn({ area, vehicles, onVehicleClick, onAddVehicle }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: area.id });
  const sorted = [...vehicles].sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
  const isDelivered = area.name === 'Entregue';

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
          <h3 className="text-sm font-semibold text-gray-200">{area.name}</h3>
          <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-md font-mono">
            {vehicles.length}
          </span>
        </div>
        {!isDelivered && (
          <button
            onClick={() => onAddVehicle(area.id)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2.5 p-2.5 rounded-xl min-h-[120px] transition-colors duration-150
          ${isOver
            ? 'bg-indigo-900/20 border-2 border-dashed border-indigo-500'
            : 'bg-gray-900/60 border-2 border-dashed border-gray-700/50'
          }
        `}
      >
        <SortableContext items={sorted.map(v => v.id)} strategy={verticalListSortingStrategy}>
          {sorted.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onClick={() => onVehicleClick(v)}
            />
          ))}
        </SortableContext>

        {sorted.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-xs text-center py-4">Nenhum veículo</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const {
    areas, vehicles,
    searchQuery, setSearchQuery,
    filterEmployeeId, setFilterEmployeeId,
    filterAreaId, setFilterAreaId,
    employees,
  } = useStore();

  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [moveToArea, setMoveToArea] = useState<Area | null>(null);
  const [moveVehicle, setMoveVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [addVehicleAreaId, setAddVehicleAreaId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const alerts = useAlerts();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const sortedAreas = useMemo(() =>
    [...areas].sort((a, b) => a.order - b.order),
    [areas]
  );

  // Active (non-completed) vehicles
  const activeVehicles = useMemo(() =>
    vehicles.filter(v => v.status === 'active'),
    [vehicles]
  );

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    let result = activeVehicles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        (v.clientName?.toLowerCase().includes(q))
      );
    }

    if (filterAreaId) {
      result = result.filter(v => v.currentAreaId === filterAreaId);
    }

    if (filterEmployeeId) {
      // Get vehicles that have history with this employee
      const { history } = useStore.getState();
      const vehicleIds = new Set(
        history
          .filter(h => h.employeeId === filterEmployeeId)
          .map(h => h.vehicleId)
      );
      result = result.filter(v => vehicleIds.has(v.id));
    }

    return result;
  }, [activeVehicles, searchQuery, filterAreaId, filterEmployeeId]);

  const getAreaVehicles = (areaId: string) =>
    filteredVehicles.filter(v => v.currentAreaId === areaId);

  const handleDragStart = (event: DragStartEvent) => {
    const v = activeVehicles.find(v => v.id === event.active.id);
    if (v) setActiveVehicle(v);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveVehicle(null);
    const { active, over } = event;
    if (!over) return;

    const vehicle = activeVehicles.find(v => v.id === active.id);
    if (!vehicle) return;

    // Find target area
    let targetAreaId = over.id as string;

    // If dropped on a card, find its area
    const overVehicle = activeVehicles.find(v => v.id === over.id);
    if (overVehicle) {
      targetAreaId = overVehicle.currentAreaId;
    }

    if (targetAreaId === vehicle.currentAreaId) return;

    const targetArea = areas.find(a => a.id === targetAreaId);
    if (!targetArea) return;

    setMoveVehicle(vehicle);
    setMoveToArea(targetArea);
    setShowMove(true);
  };

  const handleVehicleClick = (v: Vehicle) => {
    setSelectedVehicle(v);
    setShowDetail(true);
  };

  const handleAddVehicle = (areaId: string) => {
    setAddVehicleAreaId(areaId);
    setShowAddVehicle(true);
  };

  const unreadAlerts = alerts.filter(a => !a.read);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 shrink-0">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-colors ${
            showFilters || filterEmployeeId || filterAreaId
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
          }`}
        >
          <Filter size={16} />
        </button>

        {/* Alerts */}
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative p-2 rounded-xl border bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
          <Bell size={16} />
          {unreadAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
              {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
            </span>
          )}
        </button>

        {/* Add vehicle */}
        <Button
          onClick={() => { setAddVehicleAreaId(sortedAreas[0]?.id || ''); setShowAddVehicle(true); }}
          size="sm"
          className="shrink-0"
        >
          <Plus size={15} /> Veículo
        </Button>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/80 border-b border-gray-800">
          <select
            value={filterEmployeeId}
            onChange={e => setFilterEmployeeId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os funcionários</option>
            {employees.filter(e => e.active).map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select
            value={filterAreaId}
            onChange={e => setFilterAreaId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os setores</option>
            {sortedAreas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {(filterEmployeeId || filterAreaId) && (
            <button
              onClick={() => { setFilterEmployeeId(''); setFilterAreaId(''); }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Alerts panel */}
      {showAlerts && alerts.length > 0 && (
        <div className="px-4 py-3 bg-gray-900/80 border-b border-gray-800 max-h-48 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                  alert.type === 'overdue' ? 'bg-red-900/30 border border-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-900/30 border border-yellow-800' :
                  'bg-gray-800 border border-gray-700'
                }`}
              >
                <Bell size={14} className={
                  alert.type === 'overdue' ? 'text-red-400 shrink-0 mt-0.5' :
                  alert.type === 'warning' ? 'text-yellow-400 shrink-0 mt-0.5' :
                  'text-gray-400 shrink-0 mt-0.5'
                } />
                <p className={
                  alert.type === 'overdue' ? 'text-red-300' :
                  alert.type === 'warning' ? 'text-yellow-300' : 'text-gray-300'
                }>{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAlerts && alerts.length === 0 && (
        <div className="px-4 py-3 bg-gray-900/80 border-b border-gray-800">
          <p className="text-gray-500 text-sm">Nenhum alerta no momento.</p>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full min-h-0" style={{ minWidth: 'max-content' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {sortedAreas.map(area => (
              <KanbanColumn
                key={area.id}
                area={area}
                vehicles={getAreaVehicles(area.id)}
                onVehicleClick={handleVehicleClick}
                onAddVehicle={handleAddVehicle}
              />
            ))}

            <DragOverlay>
              {activeVehicle ? <VehicleCardOverlay vehicle={activeVehicle} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Modals */}
      <VehicleDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedVehicle(null); }}
        vehicle={selectedVehicle}
      />

      <MoveVehicleModal
        isOpen={showMove}
        onClose={() => { setShowMove(false); setMoveVehicle(null); setMoveToArea(null); }}
        vehicle={moveVehicle}
        toArea={moveToArea}
      />

      <VehicleModal
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        defaultAreaId={addVehicleAreaId}
      />
    </div>
  );
}
