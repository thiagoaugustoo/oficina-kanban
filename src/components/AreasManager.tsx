import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { Area } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MapPin, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#f97316', '#ef4444', '#06b6d4', '#84cc16', '#eab308',
  '#64748b', '#22c55e', '#3b82f6', '#d946ef', '#78716c',
];

function SortableAreaRow({ area, onEdit, onDelete }: {
  area: Area; onEdit: (a: Area) => void; onDelete: (a: Area) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: area.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
      <div
        {...attributes}
        {...listeners}
        className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </div>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
      <span className="text-white flex-1 text-sm font-medium">{area.name}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(area)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(area)}
          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function AreaFormModal({ isOpen, onClose, area }: {
  isOpen: boolean; onClose: () => void; area?: Area;
}) {
  const { areas, addArea, updateArea } = useStore();
  const [name, setName] = useState(area?.name || '');
  const [color, setColor] = useState(area?.color || COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    const maxOrder = Math.max(...areas.map(a => a.order), -1);
    if (area) {
      updateArea(area.id, { name, color });
    } else {
      addArea({ name, color, order: maxOrder + 1 });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={area ? 'Editar Setor' : 'Novo Setor'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do Setor *"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          error={error}
          placeholder="Ex: Alinhamento"
        />
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Cor</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" type="submit">{area ? 'Salvar' : 'Criar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AreasManager() {
  const { areas, deleteArea, reorderAreas } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editArea, setEditArea] = useState<Area | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const sortedAreas = [...areas].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedAreas.findIndex(a => a.id === active.id);
    const newIndex = sortedAreas.findIndex(a => a.id === over.id);
    const reordered = arrayMove(sortedAreas, oldIndex, newIndex).map((a, i) => ({ ...a, order: i }));
    reorderAreas(reordered);
  };

  const handleEdit = (area: Area) => {
    setEditArea(area);
    setShowForm(true);
  };

  const handleDelete = (area: Area) => {
    if (!window.confirm(`Excluir setor "${area.name}"? Os veículos neste setor precisarão ser reassociados.`)) return;
    deleteArea(area.id);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditArea(undefined);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin size={20} className="text-indigo-400" /> Setores/Áreas
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {areas.length} setor(es) · Arraste para reordenar
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Setor
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedAreas.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {sortedAreas.map(area => (
              <SortableAreaRow
                key={area.id}
                area={area}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {areas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800 border border-gray-700 rounded-2xl">
          <MapPin size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum setor cadastrado</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}><Plus size={14} /> Criar primeiro setor</Button>
        </div>
      )}

      <AreaFormModal isOpen={showForm} onClose={handleClose} area={editArea} />
    </div>
  );
}
