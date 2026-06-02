import { useState } from 'react';
import { useStore } from '../store';
import { User } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select, Toggle } from './ui/Input';
import { UserCheck, Plus, Edit2, Trash2, Shield, User as UserIcon, Mail } from 'lucide-react';

function UserFormModal({ isOpen, onClose, user }: {
  isOpen: boolean; onClose: () => void; user?: User;
}) {
  const { addUser, updateUser } = useStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: user ? '' : '',
    role: user?.role || 'user',
    active: user?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (f: string, v: string | boolean) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório';
    if (!user && !form.password.trim()) errs.password = 'Senha é obrigatória';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      let result;
      if (user) {
        const data: Partial<User> = {
          name: form.name,
          email: form.email,
          role: form.role as 'admin' | 'user',
          active: form.active,
        };
        if (form.password.trim()) data.password = form.password;
        result = await updateUser(user.id, data);
      } else {
        result = await addUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role as 'admin' | 'user',
          active: form.active,
        });
      }

      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar usuário' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errors.submit && (
          <div className="bg-red-900/20 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}
        <Input label="Nome *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="João Silva" disabled={loading} />
        <Input label="E-mail *" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} placeholder="joao@oficina.com" disabled={loading} />
        <Input
          label={user ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
          disabled={loading}
        />
        <Select label="Perfil *" value={form.role} onChange={e => set('role', e.target.value)} disabled={loading}>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </Select>
        <Toggle label="Usuário ativo" checked={form.active} onChange={v => set('active', v)} disabled={loading} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button className="flex-1" type="submit" disabled={loading}>{loading ? 'Salvando...' : (user ? 'Salvar' : 'Criar')}</Button>
        </div>
      </form>
    </Modal>
  );
}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="João Silva" />
        <Input label="E-mail *" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} placeholder="joao@oficina.com" />
        <Input
          label={user ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />
        <Select label="Perfil *" value={form.role} onChange={e => set('role', e.target.value)}>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </Select>
        <Toggle label="Usuário ativo" checked={form.active} onChange={v => set('active', v)} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" type="submit">{user ? 'Salvar' : 'Criar'}</Button>
        </div>
      </form>
    </Modal>
  );

export function UsersManager() {
  const { users, currentUser, deleteUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>();

  const handleEdit = (u: User) => {
    setEditUser(u);
    setShowForm(true);
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) { alert('Você não pode excluir seu próprio usuário.'); return; }
    if (!window.confirm(`Excluir usuário ${u.name}?`)) return;
    try {
      const result = await deleteUser(u.id);
      if (!result.success) {
        alert('Erro ao deletar: ' + result.message);
      }
    } catch (error) {
      alert('Erro ao deletar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditUser(undefined);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck size={20} className="text-indigo-400" /> Usuários do Sistema
          </h2>
          <p className="text-gray-400 text-sm mt-1">{users.length} usuário(s)</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u.id} className={`bg-gray-800 border rounded-xl p-4 ${u.id === currentUser?.id ? 'border-indigo-600' : 'border-gray-700'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.role === 'admin' ? 'bg-indigo-700 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {u.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{u.name}</p>
                    {u.id === currentUser?.id && <span className="text-xs bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded-md">Você</span>}
                  </div>
                  {u.username && (
                    <div className="text-gray-400 text-xs">
                      @{u.username}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Mail size={10} /> {u.email}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {u.role === 'admin' ? (
                  <div className="flex items-center gap-1 text-indigo-400 text-xs">
                    <Shield size={11} /> Admin
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <UserIcon size={11} /> Usuário
                  </div>
                )}
                <div className={`text-xs ${u.active ? 'text-green-400' : 'text-gray-500'}`}>
                  {u.active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} className="flex-1 text-gray-300">
                <Edit2 size={13} /> Editar
              </Button>
              {u.id !== currentUser?.id && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800 border border-gray-700 rounded-2xl">
          <UserCheck size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum usuário cadastrado</p>
        </div>
      )}

      <UserFormModal isOpen={showForm} onClose={handleClose} user={editUser} />
    </div>
  );
}