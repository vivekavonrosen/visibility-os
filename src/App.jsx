import { useApp } from './context/AppContext.jsx';
import Landing from './pages/Landing.jsx';
import Workspace from './pages/Workspace.jsx';
import './globals.css';

function AppRouter() {
  const { state } = useApp();
  return state.view === 'app' ? <Workspace /> : <Landing />;
}

export default function App() {
  return <AppRouter />;
}
