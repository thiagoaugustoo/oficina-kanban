import { useState } from 'react';
import { useStore } from '../store';
import { Vehicle } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getDeadlineStatus, getDeadlineLabel, formatDate, formatDateTime, formatDuration } from '../utils/deadline';
import {
  User, Clock, MapPin, Edit2, CheckCircle, RotateCcw,
  FileText, Calendar
} from 'lucide-react';
import { VehicleModal } from './VehicleModal';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function VehicleDetailModal({ isOpen, onClose, vehicle }: VehicleDetailModalProps) {
  const { areas, employees, currentUser, reopenVehicle, getVehicleHistory } = useStore();
  const [showEdit, setShowEdit] = useState(false);

  if (!vehicle) return null;

  const vHistory = getVehicleHistory(vehicle.id);
  const currentArea = areas.find(a => a.id === vehicle.currentAreaId);
  const deadlineStatus = getDeadlineStatus(vehicle);

  const deadlineColors = {
    ok: 'success',
    warning: 'warning',
    overdue: 'danger',
    delivered: 'info',
  } as const;

  const getAreaName = (id?: string) => areas.find(a => a.id === id)?.name || '-';
  const getEmployeeName = (id?: string) => {
    if (!id) return 'Não informado';
    return employees.find(e => e.id === id)?.name || 'Não informado';
  };

  const estimatorName = getEmployeeName(vehicle.estimatorId);

  const workedEmployees = [...new Set(
    vHistory
      .filter(h => h.employeeId)
      .map(h => h.employeeId!)
  )].map(id => employees.find(e => e.id === id)).filter(Boolean);

  const getHistoryLabel = (h: typeof vHistory[0]) => {
    switch (h.type) {
      case 'created': return `Veículo criado → ${getAreaName(h.toAreaId)}`;
      case 'moved': return `Movido para ${getAreaName(h.toAreaId)}`;
      case 'completed': return `Entregue (concluído)`;
      case 'reopened': return `Reaberto → ${getAreaName(h.toAreaId)}`;
      case 'edited': return `Dados editados`;
      default: return 'Atualizado';
    }
  };

  const handleReopen = () => {
    reopenVehicle(vehicle.id);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen && !showEdit} onClose={onClose} title="Detalhes do Veículo" size="xl">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{vehicle.model}</h3>
                <span className="text-indigo-400 font-mono font-semibold">{vehicle.plate}</span>
              </div>
              <p className="text-gray-400 text-sm">{vehicle.brand}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={deadlineColors[deadlineStatus]}>
                {getDeadlineLabel(deadlineStatus)}
              </Badge>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <User size={12} /> Cliente
              </div>
              <p className="text-white text-sm font-medium">{vehicle.clientName || 'Não informado'}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <User size={12} /> Orçamentista
              </div>
              <p className="text-white text-sm font-medium">{estimatorName}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Calendar size={12} /> Entrada
              </div>
              <p className="text-white text-sm font-medium">{formatDate(vehicle.entryDate)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Calendar size={12} /> Entrega Prometida
              </div>
              <p className="text-white text-sm font-medium">{formatDate(vehicle.promisedDate)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <MapPin size={12} /> Setor Atual
              </div>
              <p className="text-white text-sm font-medium">{currentArea?.name || '-'}</p>
            </div>
            {vehicle.completedAt && (
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <CheckCircle size={12} /> Concluído em
                </div>
                <p className="text-white text-sm font-medium">{formatDate(vehicle.completedAt)}</p>
              </div>
            )}
          </div>

          {/* Time in production */}
          {vehicle.completedAt && (
            <div className="bg-green-900/20 border border-green-800 rounded-xl p-3 flex items-center gap-3">
              <Clock size={16} className="text-green-400" />
              <div>
                <p className="text-xs text-green-400">Tempo total em produção</p>
                <p className="text-white font-semibold">{formatDuration(vehicle.entryDate, vehicle.completedAt)}</p>
              </div>
            </div>
          )}

          {/* Observations */}
          {vehicle.observations && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <FileText size={12} /> Observações
              </div>
              <p className="text-gray-300 text-sm">{vehicle.observations}</p>
            </div>
          )}

          {/* Employees who worked */}
          {workedEmployees.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Funcionários que trabalharam</p>
              <div className="flex flex-wrap gap-2">
                {workedEmployees.map(emp => emp && (
                  <div key={emp.id} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{emp.name}</p>
                      <p className="text-gray-500 text-xs">{emp.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">Histórico Completo</p>
            <div className="flex flex-col gap-0">
              {vHistory.map((h, idx) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      h.type === 'created' ? 'bg-green-500' :
                      h.type === 'completed' ? 'bg-blue-500' :
                      h.type === 'reopened' ? 'bg-yellow-500' :
                      'bg-indigo-500'
                    }`} />
                    {idx < vHistory.length - 1 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
                  </div>
                  <div className={`pb-4 flex-1 ${idx === vHistory.length - 1 ? 'pb-0' : ''}`}>
                    <p className="text-white text-sm">{getHistoryLabel(h)}</p>
                    {h.employeeId && (
                      <p className="text-indigo-400 text-xs">Funcionário: {getEmployeeName(h.employeeId)}</p>
                    )}
                    {h.notes && <p className="text-gray-500 text-xs">{h.notes}</p>}
                    <p className="text-gray-500 text-xs mt-0.5">{formatDateTime(h.timestamp)}</p>
                  </div>
                </div>
              ))}
              {vHistory.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum histórico disponível.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-700">
            <Button variant="secondary" onClick={() => setShowEdit(true)} className="flex items-center gap-2">
              <Edit2 size={14} /> Editar
            </Button>
            {vehicle.status === 'completed' && currentUser?.role === 'admin' && (
              <Button variant="ghost" onClick={handleReopen} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20">
                <RotateCcw size={14} /> Reabrir
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      <VehicleModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        vehicle={vehicle}
      />
    </>
  );
}
