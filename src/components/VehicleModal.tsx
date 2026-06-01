import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Vehicle } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select, Textarea } from './ui/Input';


interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
  defaultAreaId?: string;
}

export function VehicleModal({ isOpen, onClose, vehicle, defaultAreaId }: VehicleModalProps) {
  const { areas, currentUser, employees, addVehicle, updateVehicle } = useStore();
  const sortedAreas = [...areas].sort((a, b) => a.order - b.order);
  const activeEstimators = employees.filter(e => e.active && e.isEstimator);

  const [form, setForm] = useState({
    plate: '',
    brand: '',
    model: '',
    color: '',
    clientName: '',
    observations: '',
    entryDate: new Date().toISOString().split('T')[0],
    promisedDate: '',
    estimatorId: activeEstimators[0]?.id || '',
    currentAreaId: defaultAreaId || areas[0]?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setForm({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color || '',
        clientName: vehicle.clientName || '',
        observations: vehicle.observations || '',
        entryDate: vehicle.entryDate,
        promisedDate: vehicle.promisedDate || '',
        estimatorId: vehicle.estimatorId,
        currentAreaId: vehicle.currentAreaId,
      });
    } else {
      setForm({
        plate: '',
        brand: '',
        model: '',
        color: '',
        clientName: '',
        observations: '',
        entryDate: new Date().toISOString().split('T')[0],
        promisedDate: '',
        estimatorId: activeEstimators[0]?.id || '',
        currentAreaId: defaultAreaId || areas[0]?.id || '',
      });
    }
    setErrors({});
  }, [isOpen, vehicle]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.plate.trim()) errs.plate = 'Placa é obrigatória';
    if (!form.brand.trim()) errs.brand = 'Marca é obrigatória';
    if (!form.model.trim()) errs.model = 'Modelo é obrigatório';
    if (!form.entryDate) errs.entryDate = 'Data de entrada é obrigatória';
    if (!form.estimatorId.trim()) errs.estimatorId = 'Orçamentista é obrigatório';
    if (!form.currentAreaId) errs.currentAreaId = 'Setor é obrigatório';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (vehicle) {
      updateVehicle(vehicle.id, {
        plate: form.plate.toUpperCase(),
        brand: form.brand,
        model: form.model,
        color: form.color || undefined,
        clientName: form.clientName || undefined,
        observations: form.observations || undefined,
        entryDate: form.entryDate,
        promisedDate: form.promisedDate || undefined,
        estimatorId: form.estimatorId,
        currentAreaId: form.currentAreaId,
      });
    } else {
      addVehicle({
        plate: form.plate.toUpperCase(),
        brand: form.brand,
        model: form.model,
        color: form.color || undefined,
        clientName: form.clientName || undefined,
        observations: form.observations || undefined,
        entryDate: form.entryDate,
        promisedDate: form.promisedDate || undefined,
        estimatorId: form.estimatorId,
        currentAreaId: form.currentAreaId,
        createdByUserId: currentUser?.id || '',
      });
    }
    onClose();
  };

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Editar Veículo' : 'Novo Veículo'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Placa *"
            value={form.plate}
            onChange={e => set('plate', e.target.value.toUpperCase())}
            placeholder="MHZ-5F94"
            error={errors.plate}
            maxLength={10}
          />
          <Input
            label="Cor"
            value={form.color}
            onChange={e => set('color', e.target.value)}
            placeholder="Branco"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca *"
            value={form.brand}
            onChange={e => set('brand', e.target.value)}
            placeholder="Chevrolet"
            error={errors.brand}
          />
          <Input
            label="Modelo *"
            value={form.model}
            onChange={e => set('model', e.target.value)}
            placeholder="Celta"
            error={errors.model}
          />
        </div>

        <Input
          label="Nome do Cliente"
          value={form.clientName}
          onChange={e => set('clientName', e.target.value)}
          placeholder="João Silva"
        />

        <Select
          label="Orçamentista *"
          value={form.estimatorId}
          onChange={e => set('estimatorId', e.target.value)}
          error={errors.estimatorId}
        >
          <option value="">Selecionar orçamentista...</option>
          {activeEstimators.length > 0 ? (
            activeEstimators.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
            ))
          ) : (
            <option value="" disabled>Nenhum orçamentista ativo</option>
          )}
        </Select>

        <Select
          label="Setor Inicial *"
          value={form.currentAreaId}
          onChange={e => set('currentAreaId', e.target.value)}
          error={errors.currentAreaId}
        >
          <option value="">Selecionar setor...</option>
          {sortedAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de Entrada *"
            type="date"
            value={form.entryDate}
            onChange={e => set('entryDate', e.target.value)}
            error={errors.entryDate}
          />
          <Input
            label="Data Prometida"
            type="date"
            value={form.promisedDate}
            onChange={e => set('promisedDate', e.target.value)}
          />
        </div>

        <Textarea
          label="Observações"
          value={form.observations}
          onChange={e => set('observations', e.target.value)}
          placeholder="Observações sobre o veículo..."
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {vehicle ? 'Salvar Alterações' : 'Cadastrar Veículo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
