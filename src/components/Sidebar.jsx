import { useApp } from '../context/AppContext.jsx';
import { MODULES } from '../data/modules.js';
import { getEffectiveOutput } from '../utils/storage.js';

export default function Sidebar() {
  const { state, setCurrentModule } = useApp();

  const completed = MODULES.filter(m => getEffectiveOutput(state, m.id)).length;
  const percent = Math.round((completed / MODULES.length) * 100);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          VISIBILITY<br />
          <span>INFRASTRUCTURE</span><br />
          OS
        </div>
        <div className="sidebar-tagline">Strategy System for Women 50+</div>
      </div>

      <div className="sidebar-progress-section">
        <div className="sidebar-progress-label">
          <span>Progress</span>
          <span style={{ color: 'var(--teal-light)', fontWeight: 700 }}>
            {completed}/{MODULES.length}
          </span>
        </div>
        <div className="sidebar-progress-bar">
          <div className="sidebar-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {MODULES.map((module, index) => {
          const isActive = state.currentModule === index;
          const isCompleted = !!getEffectiveOutput(state, module.id);

          return (
            <div
              key={module.id}
              className={`nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => setCurrentModule(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setCurrentModule(index)}
            >
              <span className="nav-num">{module.number}</span>
              <div className="nav-icon">{module.icon}</div>
              <div className="nav-text">
                <div className="nav-title">{module.title}</div>
                <div className="nav-subtitle">{module.subtitle}</div>
              </div>
              <div className="nav-status" />
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
