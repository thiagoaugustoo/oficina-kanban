import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { Vehicle } from '../types';
import { getDeadlineStatus, getDeadlineColor, getDeadlineLabel, formatDate } from '../utils/deadline';
import { User, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  onMoveClick?: (vehicle: Vehicle) => void;
  isDragging?: boolean;
}

export function VehicleCard({ vehicle, onClick, isDragging }: VehicleCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({
    id: vehicle.id,
    data: { vehicle },
  });
  const { employees, users } = useStore();
  const estimator = users.find(u => u.id === vehicle.estimatorId) || employees.find(e => e.id === vehicle.estimatorId);
  const estimatorLabel = estimator ? `${estimator.name}${estimator.role ? ` · ${estimator.role}` : ''}` : vehicle.estimatorId;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.3 : 1,
  };

  const deadlineStatus = getDeadlineStatus(vehicle);
  const deadlineColor = getDeadlineColor(deadlineStatus);
  const deadlineLabel = getDeadlineLabel(deadlineStatus);
  const isOverdue = deadlineStatus === 'overdue';
  const isWarning = deadlineStatus === 'warning';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-gray-800 border rounded-xl overflow-hidden cursor-pointer select-none
        transition-all duration-150 hover:border-gray-500 hover:shadow-lg hover:-translate-y-0.5
        ${isOverdue ? 'border-red-700/50' : isWarning ? 'border-yellow-700/50' : 'border-gray-700'}
        ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500' : ''}
        active:scale-98
      `}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Deadline indicator bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: deadlineColor }} />

      <div className="p-3.5">
        {/* Model + plate */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{vehicle.model}</p>
            <p className="text-indigo-400 font-mono text-xs font-bold mt-0.5">{vehicle.plate}</p>
          </div>
          {isOverdue && (
            <div className="shrink-0">
              <AlertTriangle size={14} className="text-red-400" />
            </div>
          )}
        </div>

        {/* Client name */}
        {vehicle.clientName && (
          <p className="text-gray-400 text-xs mb-2 truncate">
            {vehicle.clientName}
          </p>
        )}

        {/* Estimator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <User size={11} />
          <span className="truncate">{estimatorLabel}</span>
        </div>

        {/* Deadline */}
        {vehicle.promisedDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: deadlineColor }}>
              <Calendar size={11} />
              <span>{formatDate(vehicle.promisedDate)}</span>
            </div>
            {(isOverdue || isWarning) && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${deadlineColor}20`,
                  color: deadlineColor,
                  border: `1px solid ${deadlineColor}40`
                }}
              >
                {deadlineLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Overlay version (shown while dragging)
export function VehicleCardOverlay({ vehicle }: { vehicle: Vehicle }) {
  const deadlineStatus = getDeadlineStatus(vehicle);
  const deadlineColor = getDeadlineColor(deadlineStatus);

  return (
    <div className="bg-gray-800 border border-indigo-500 rounded-xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/50 rotate-2 scale-105">
      <div className="h-1.5 w-full" style={{ backgroundColor: deadlineColor }} />
      <div className="p-3.5">
        <p className="text-white font-semibold text-sm">{vehicle.model}</p>
        <p className="text-indigo-400 font-mono text-xs font-bold mt-0.5">{vehicle.plate}</p>
      </div>
    </div>
  );
}
