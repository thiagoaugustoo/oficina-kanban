import { useStore } from './store';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { CompletedVehicles } from './components/CompletedVehicles';
import { EmployeesManager } from './components/EmployeesManager';
import { AreasManager } from './components/AreasManager';
import { UsersManager } from './components/UsersManager';

export default function App() {
  const { currentUser, activeView } = useStore();

  if (!currentUser) {
    return <Login />;
  }

  const isAdmin = currentUser.role === 'admin';

  const renderView = () => {
    switch (activeView) {
      case 'kanban':
        return <KanbanBoard />;
      case 'dashboard':
        return <Dashboard />;
      case 'completed':
        return <CompletedVehicles />;
      case 'employees':
        return isAdmin ? <EmployeesManager /> : <KanbanBoard />;
      case 'areas':
        return isAdmin ? <AreasManager /> : <KanbanBoard />;
      case 'users':
        return isAdmin ? <UsersManager /> : <KanbanBoard />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-auto flex flex-col min-w-0 ${activeView === 'kanban' ? 'overflow-hidden' : ''}`}>
        {renderView()}
      </main>
    </div>
  );
}
