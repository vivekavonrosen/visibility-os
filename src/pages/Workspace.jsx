import { useApp } from '../context/AppContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ModuleShell from '../components/ModuleShell.jsx';
import ExportBar from '../components/ExportBar.jsx';

export default function Workspace() {
  const { state } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <ExportBar />
        <ModuleShell moduleIndex={state.currentModule || 0} />
      </div>
    </div>
  );
}
