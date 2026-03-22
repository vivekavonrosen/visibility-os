import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ModuleShell from '../components/ModuleShell.jsx';
import ExportBar from '../components/ExportBar.jsx';
import ApiKeyModal from '../components/ApiKeyModal.jsx';

export default function Workspace() {
  const { state } = useApp();
  const [showApiModal, setShowApiModal] = useState(!state.apiKey);

  return (
    <div className="app-layout">
      <Sidebar onApiKeyClick={() => setShowApiModal(true)} />

      <div className="main-content">
        <ExportBar onApiKeyClick={() => setShowApiModal(true)} />
        <ModuleShell
          moduleIndex={state.currentModule || 0}
        />
      </div>

      {showApiModal && (
        <ApiKeyModal onClose={() => setShowApiModal(false)} />
      )}
    </div>
  );
}
