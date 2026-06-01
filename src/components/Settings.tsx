import React from 'react';
import { useStore } from '../store';
import { Button } from './ui/Button';
import { MapPin, Users, CheckSquare } from 'lucide-react';

export function Settings() {
  const setActiveView = useStore(s => s.setActiveView);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Configurações da Oficina</h2>
      <p className="text-gray-400 mb-6">Gerencie áreas, funcionários e orçamentistas do sistema.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-indigo-400" />
            <div>
              <p className="font-semibold">Setores</p>
              <p className="text-xs text-gray-400">Adicionar e editar áreas de trabalho</p>
            </div>
          </div>
          <Button onClick={() => setActiveView('areas')}>Gerenciar Setores</Button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-400" />
            <div>
              <p className="font-semibold">Funcionários</p>
              <p className="text-xs text-gray-400">Cadastrar e editar funcionários</p>
            </div>
          </div>
          <Button onClick={() => setActiveView('employees')}>Gerenciar Funcionários</Button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CheckSquare size={20} className="text-indigo-400" />
            <div>
              <p className="font-semibold">Orçamentistas</p>
              <p className="text-xs text-gray-400">Visualizar e marcar orçamentistas</p>
            </div>
          </div>
          <Button onClick={() => setActiveView('employees')}>Gerenciar Orçamentistas</Button>
        </div>
      </div>
    </div>
  );
}
