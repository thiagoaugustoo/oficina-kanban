import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Vehicle } from '../types';
import { useStore } from '../store';
import { 
  Clock, AlertCircle, User, Calendar, GripVertical, 
  ArrowRight, Check, CheckCircle2 
} from 'lucide-react';
import { formatDate, formatDuration, getDeadlineStatus } from '../utils/deadline';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  onMoveClick: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, onClick, onMoveClick }: VehicleCardProps) {
  const { areas, employees, users, completeVehicle, currentUser } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: vehicle.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const area = areas.find(a => a.id === vehicle.currentAreaId);
  const deadlineStatus = vehicle.deadline ? getDeadlineStatus(vehicle.deadline) : null;
  const estimatorName = users.find(u => u.id === vehicle.estimatorId)?.name || 
                       employees.find(e => e.id === vehicle.estimatorId)?.name || 
                       'N/A';

  // Verificar se está na área "Entregue"
  const deliveredArea = areas.find(a => a.name === 'Entregue');
  const isInDeliveredArea = vehicle.currentAreaId === deliveredArea?.id;
  const isAdmin = currentUser?.role === 'admin';

  // Mostrar botão de concluir se:
  // 1. Está na área "Entregue" OU
  // 2. É admin (pode concluir de qualquer área)
  const canComplete = isInDeliveredArea || isAdmin;

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal de detalhes
    
    if (!window.confirm(`Deseja marcar o veículo ${vehicle.model} (${vehicle.plate}) como concluído?\n\nO veículo será removido do Kanban e movido para "Concluídos".`)) {
      return;
    }

    try {
      await completeVehicle(vehicle.id, currentUser?.id);
    } catch (error) {
      console.error('Erro ao concluir veículo:', error);
      alert('Erro ao concluir veículo. Tente novamente.');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-600 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Drag handle + Header */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing mt-0.5 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate">{vehicle.model}</h4>
          <p className="text-indigo-400 font-mono text-xs font-bold">{vehicle.plate}</p>
        </div>

        {/* Badge de status */}
        {isInDeliveredArea && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 text-green-400 rounded-md text-xs font-medium border border-green-800">
            <CheckCircle2 className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3 ml-5">
        {vehicle.clientName && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <User className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="truncate">{vehicle.clientName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
          <span>{formatDate(vehicle.entryDate)}</span>
        </div>

        {vehicle.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${
            deadlineStatus?.status === 'overdue' ? 'text-red-400 font-medium' :
            deadlineStatus?.status === 'warning' ? 'text-yellow-400' :
            'text-gray-400'
          }`}>
            <Clock className="w-3 h-3 shrink-0" />
            <span>Prazo: {formatDate(vehicle.deadline)}</span>
            {deadlineStatus?.status === 'overdue' && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
        )}

        {vehicle.estimatorId && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <User className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="truncate">Orç: {estimatorName}</span>
          </div>
        )}

        {/* Tempo na área */}
        {vehicle.updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-700/50">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Nesta área: {formatDuration(vehicle.updatedAt, new Date().toISOString())}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="ml-5 flex gap-2">
        {/* Botão Concluir - NOVO */}
        {canComplete && (
          <button
            onClick={handleComplete}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold hover:shadow-lg hover:shadow-green-600/30"
          >
            <Check className="w-3.5 h-3.5" />
            Concluir
          </button>
        )}

        {/* Botão Mover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveClick(vehicle);
          }}
          className={`${canComplete ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          {canComplete ? '' : 'Mover'}
        </button>
      </div>

      {/* Info extra para admin */}
      {isAdmin && !isInDeliveredArea && (
        <p className="text-xs text-yellow-400/50 mt-2 text-center ml-5">
          Admin: pode concluir de qualquer área
        </p>
      )}
    </div>
  );
}

// Componente overlay (para arrastar)
export function VehicleCardOverlay({ vehicle }: { vehicle: Vehicle }) {
  const { areas } = useStore();
  const area = areas.find(a => a.id === vehicle.currentAreaId);

  return (
    <div
      className="bg-gray-800 border-2 border-indigo-500 rounded-xl p-3 w-72 shadow-2xl rotate-3 opacity-90"
      style={{ borderLeftColor: area?.color }}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-gray-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{vehicle.model}</h4>
          <p className="text-indigo-400 font-mono text-xs font-bold">{vehicle.plate}</p>
        </div>
      </div>
    </div>
  );
}