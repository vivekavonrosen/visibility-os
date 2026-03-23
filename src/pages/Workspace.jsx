import { useApp } from '../context/AppContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ModuleShell from '../components/ModuleShell.jsx';
import ExportBar from '../components/ExportBar.jsx';
import CompletionPage from './CompletionPage.jsx';

export default function Workspace() {
  const { state } = useApp();
  const isComplete = state.view === 'complete';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <ExportBar />
        {isComplete
          ? <CompletionPage />
          : <ModuleShell moduleIndex={state.currentModule || 0} />
        }
      </div>
    </div>
  );
}
