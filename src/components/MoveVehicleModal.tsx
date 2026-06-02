import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Vehicle, Area } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Input';
import { ArrowRight, User } from 'lucide-react';

interface MoveVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  toArea?: Area | null;
}

export function MoveVehicleModal({ isOpen, onClose, vehicle, toArea }: MoveVehicleModalProps) {
  const { areas, employees, moveVehicle } = useStore();
  const activeEmployees = employees.filter(e => e.active);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(toArea?.id || '');

  useEffect(() => {
    setSelectedAreaId(toArea?.id || '');
  }, [toArea, vehicle]);

  const handleConfirm = () => {
    if (!vehicle) return;
    const targetArea = toArea || areas.find(a => a.id === selectedAreaId);
    if (!targetArea) return;
    moveVehicle(vehicle.id, targetArea.id, employeeId || undefined);
    setEmployeeId('');
    onClose();
  };

  const handleClose = () => {
    setEmployeeId('');
    onClose();
  };

  if (!vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mover Veículo" size="sm">
      <div className="flex flex-col gap-5">
        {/* Vehicle info */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Veículo</p>
          <p className="text-white font-semibold">{vehicle.model} <span className="text-indigo-400">{vehicle.plate}</span></p>
        </div>

        {/* Move info */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 mb-1">De</div>
            <div className="bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300">
              {useStore.getState().areas.find(a => a.id === vehicle.currentAreaId)?.name || 'Desconhecido'}
            </div>
          </div>
          <ArrowRight className="text-indigo-400 shrink-0" size={18} />
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 mb-1">Para</div>
            <div className="bg-indigo-900/40 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-indigo-300 font-medium">
              {toArea?.name || 'Selecione um setor abaixo'}
            </div>
          </div>
        </div>

        {/* Target area selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={16} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-300">Mover para outro setor</p>
          </div>
          <Select
            value={selectedAreaId}
            onChange={e => setSelectedAreaId(e.target.value)}
          >
            <option value="">Selecionar setor de destino...</option>
            {areas
              .filter(a => a.id !== vehicle.currentAreaId)
              .map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
          </Select>
        </div>

        {/* Employee selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-300">Quem irá trabalhar neste veículo?</p>
          </div>
          <Select
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
          >
            <option value="">Não definir agora</option>
            {activeEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} – {emp.role}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleConfirm}>
            Confirmar Movimentação
          </Button>
        </div>
      </div>
    </Modal>
  );
}
