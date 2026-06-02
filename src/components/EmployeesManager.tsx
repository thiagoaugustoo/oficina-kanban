import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Employee } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select, Toggle } from './ui/Input';
import { Users, Plus, Edit2, Trash2, Phone, Briefcase, XCircle, CheckCircle } from 'lucide-react';

function EmployeeFormModal({ isOpen, onClose, employee }: {
  isOpen: boolean; onClose: () => void; employee?: Employee;
}) {
  const { addEmployee, updateEmployee, areas } = useStore();
  const [form, setForm] = useState({
    name: employee?.name || '',
    role: employee?.role || '',
    areaId: employee?.areaId || '',
    phone: employee?.phone || '',
    active: employee?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        role: employee.role,
        areaId: employee.areaId || '',
        phone: employee.phone || '',
        active: employee.active,
      });
    } else {
      setForm({
        name: '',
        role: '',
        areaId: '',
        phone: '',
        active: true,
      });
    }
    setErrors({});
  }, [isOpen, employee]);

  const set = (f: string, v: string | boolean) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (!form.role.trim()) errs.role = 'Função é obrigatória';
    if (!form.areaId) errs.areaId = 'Área é obrigatória';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        areaId: form.areaId || undefined,
        phone: form.phone || undefined,
      };

      let result;
      if (employee) {
        result = await updateEmployee(employee.id, payload);
      } else {
        result = await addEmployee(payload);
      }

      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar funcionário' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Editar Funcionário' : 'Novo Funcionário'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errors.submit && (
          <div className="bg-red-900/20 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}
        <Input label="Nome *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="Roberto" disabled={loading} />
        <Input label="Função *" value={form.role} onChange={e => set('role', e.target.value)} error={errors.role} placeholder="Mecânico" disabled={loading} />
        <Select
          label="Setor"
          value={form.areaId}
          onChange={e => set('areaId', e.target.value)}
          error={errors.areaId}
          disabled={loading}
        >
          <option value="">Selecionar setor...</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </Select>
        <Input label="Telefone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" disabled={loading} />
        <Toggle label="Funcionário ativo" checked={form.active} onChange={v => set('active', v)} disabled={loading} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button className="flex-1" type="submit" disabled={loading}>{loading ? 'Salvando...' : (employee ? 'Salvar' : 'Cadastrar')}</Button>
        </div>
      </form>
    </Modal>
  );
}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Editar Funcionário' : 'Novo Funcionário'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="Roberto" />
        <Input label="Função *" value={form.role} onChange={e => set('role', e.target.value)} error={errors.role} placeholder="Mecânico" />
        <Select
          label="Setor"
          value={form.areaId}
          onChange={e => set('areaId', e.target.value)}
          error={errors.areaId}
        >
          <option value="">Selecionar setor...</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </Select>
        <Input label="Telefone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
        <Toggle label="Funcionário ativo" checked={form.active} onChange={v => set('active', v)} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" type="submit">{employee ? 'Salvar' : 'Cadastrar'}</Button>
        </div>
      </form>
    </Modal>
  );

export function EmployeesManager() {
  const { employees, deleteEmployee, areas } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();

  const active = employees.filter(e => e.active);
  const inactive = employees.filter(e => !e.active);

  const areaGroups = areas
    .map(area => ({
      areaId: area.id,
      areaName: area.name,
      employees: active.filter(emp => emp.areaId === area.id),
    }))
    .filter(group => group.employees.length > 0);

  const unassignedGroup = {
    areaId: 'unassigned',
    areaName: 'Sem Área',
    employees: active.filter(emp => !emp.areaId || !areas.some(a => a.id === emp.areaId)),
  };

  const visibleAreaGroups = unassignedGroup.employees.length > 0
    ? [...areaGroups, unassignedGroup]
    : areaGroups;

  const handleEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setShowForm(true);
  };

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Excluir funcionário ${emp.name}?`)) return;
    try {
      const result = await deleteEmployee(emp.id);
      if (!result.success) {
        alert('Erro ao deletar: ' + result.message);
      }
    } catch (error) {
      alert('Erro ao deletar funcionário: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditEmployee(undefined);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-indigo-400" /> Funcionários
          </h2>
          <p className="text-gray-400 text-sm mt-1">{active.length} ativo(s), {inactive.length} inativo(s)</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Funcionário
        </Button>
      </div>


      {visibleAreaGroups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Por área</p>
            <span className="text-xs text-gray-500">{active.length} funcionário(s)</span>
          </div>
          <div className="space-y-6">
            {visibleAreaGroups.map(group => (
              <div key={group.areaId}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-300">{group.areaName}</p>
                  <span className="text-xs text-gray-500">{group.employees.length} pessoa(s)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.employees.map(emp => (
                    <div key={emp.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center text-white font-bold text-sm">
                            {emp.name[0]}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{emp.name}</p>
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <Briefcase size={10} /> {emp.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-400" />
                        </div>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                          <Phone size={11} /> {emp.phone}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)} className="flex-1 text-gray-300">
                          <Edit2 size={13} /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive employees */}
      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Inativos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inactive.map(emp => (
              <div key={emp.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 opacity-70">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-gray-400 font-bold text-sm">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold">{emp.name}</p>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Briefcase size={10} /> {emp.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle size={14} className="text-gray-600" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)} className="flex-1 text-gray-400">
                    <Edit2 size={13} /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800 border border-gray-700 rounded-2xl">
          <Users size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum funcionário cadastrado</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}><Plus size={14} /> Cadastrar primeiro</Button>
        </div>
      )}

      <EmployeeFormModal isOpen={showForm} onClose={handleClose} employee={editEmployee} />
    </div>
  );
}
