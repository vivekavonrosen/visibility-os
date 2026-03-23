import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { MODULES, INTAKE_FIELDS } from '../data/modules.js';
import { getModuleData, getEffectiveOutput } from '../utils/storage.js';
import { streamCompletion } from '../utils/api.js';
import OutputBlock from './OutputBlock.jsx';

// Business Context gets special treatment — it's the intake form
function BusinessContextInputs({ data, onChange }) {
  const sections = [
    {
      title: 'Core Business',
      fields: INTAKE_FIELDS.filter(f => ['brandName','businessDesc','niche','primaryOffer','secondaryOffers'].includes(f.id)),
    },
    {
      title: 'Your Audience',
      fields: INTAKE_FIELDS.filter(f => ['targetAudience','audienceProblem','audienceDesire'].includes(f.id)),
    },
    {
      title: 'Your Authority',
      fields: INTAKE_FIELDS.filter(f => ['brandStrengths','founderBg','uniqueMechanism'].includes(f.id)),
    },
    {
      title: 'Competitive Landscape',
      fields: INTAKE_FIELDS.filter(f => ['competitor1','competitor2','competitor3'].includes(f.id)),
    },
    {
      title: 'Platforms & Content',
      fields: INTAKE_FIELDS.filter(f => ['platforms','contentApproach','brandVoice','callToAction'].includes(f.id)),
    },
    {
      title: 'Goals & Business Model',
      fields: INTAKE_FIELDS.filter(f => ['growthGoal','revenueGoal','pricePoint','salesModel','geography','constraints'].includes(f.id)),
    },
  ];

  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="form-section">
          <div className="form-section-title">{section.title}</div>
          <div className="form-grid">
            {section.fields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={data[field.id] || ''}
                onChange={(val) => onChange(field.id, val)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// Reusable field input
function FieldInput({ field, value, onChange }) {
  const isWide = field.type === 'textarea';

  return (
    <div className={`form-field ${isWide ? 'span-2' : ''}`}>
      <label className="form-label">
        {field.label}
        {field.required && <span> *</span>}
      </label>
      {field.hint && <p className="form-hint">{field.hint}</p>}

      {field.type === 'textarea' ? (
        <textarea
          className={`form-textarea ${field.tall ? 'tall' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
        />
      ) : field.type === 'select' ? (
        <select
          className="form-select form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
        />
      )}
    </div>
  );
}

export default function ModuleShell({ moduleIndex, onNavigate }) {
  const { state, setBusinessContext, saveModuleOutput, saveModuleInputs, saveEditedOutput, setCurrentModule } = useApp();
  const module = MODULES[moduleIndex];
  const moduleData = getModuleData(state, module.id);
  const existingOutput = getEffectiveOutput(state, module.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  // Local state for additional module inputs
  const [localInputs, setLocalInputs] = useState(moduleData.inputs || {});
  const [localCtx, setLocalCtx] = useState(state.businessContext || {});

  // Get prior module's output for context
  function getPriorOutput() {
    if (moduleIndex === 0) return null;
    // Collect outputs from all prior modules
    const priorOutputs = MODULES
      .slice(0, moduleIndex)
      .map(m => getEffectiveOutput(state, m.id))
      .filter(Boolean);
    if (!priorOutputs.length) return null;
    // Use immediately prior module's output as primary context
    return priorOutputs[priorOutputs.length - 1];
  }

  function handleBusinessContextChange(fieldId, value) {
    const updated = { ...localCtx, [fieldId]: value };
    setLocalCtx(updated);
    setBusinessContext(updated);
  }

  function handleInputChange(fieldId, value) {
    const updated = { ...localInputs, [fieldId]: value };
    setLocalInputs(updated);
    saveModuleInputs(module.id, updated);
  }

  async function handleGenerate() {
    setError('');
    setIsGenerating(true);
    setStreamingText('');

    // Build prompt
    const ctx = moduleIndex === 0 ? localCtx : state.businessContext;
    const prior = getPriorOutput();
    const extras = moduleIndex === 0 ? null : localInputs;

    let prompt;
    try {
      if (moduleIndex === 0) {
        prompt = module.buildPrompt(ctx);
      } else {
        prompt = module.buildPrompt(ctx, prior, extras);
      }
    } catch (e) {
      setError('Failed to build prompt: ' + e.message);
      setIsGenerating(false);
      return;
    }

    abortRef.current = streamCompletion(
      prompt,
      (chunk, full) => {
        setStreamingText(full);
      },
      (fullText) => {
        saveModuleOutput(module.id, fullText);
        setIsGenerating(false);
        setStreamingText('');
      },
      (errMsg) => {
        setError(errMsg);
        setIsGenerating(false);
        setStreamingText('');
      }
    );
  }

  function handleAbort() {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsGenerating(false);
      if (streamingText) {
        saveModuleOutput(module.id, streamingText);
      }
    }
  }

  const priorOutput = getPriorOutput();
  const hasPriorContext = moduleIndex > 0 && !!priorOutput;
  const isFirstModule = moduleIndex === 0;

  return (
    <div className="module-area fade-in">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-num-badge">
          {module.icon} Module {module.number} of {MODULES.length}
        </div>
        <h1 className="module-title">{module.title}</h1>
        <div className="module-subtitle">{module.subtitle}</div>
        <p className="module-desc">{module.description}</p>
      </div>

      {/* Prior Context Banner */}
      {hasPriorContext && (
        <div className="context-banner">
          <span className="context-banner-icon">🔗</span>
          <div className="context-banner-text">
            <strong>Context carried forward</strong> from Module {MODULES[moduleIndex - 1].number}: {MODULES[moduleIndex - 1].title}.
            The AI will use your prior strategy output as fixed context for this module.
          </div>
        </div>
      )}

      {/* Inputs */}
      {isFirstModule ? (
        <BusinessContextInputs data={localCtx} onChange={handleBusinessContextChange} />
      ) : (
        module.additionalFields && module.additionalFields.length > 0 && (
          <div className="form-section">
            <div className="form-section-title">Additional Context</div>
            <div className="form-grid">
              {module.additionalFields.map((field) => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={localInputs[field.id] || (field.type === 'select' ? field.options?.[0] : '')}
                  onChange={(val) => handleInputChange(field.id, val)}
                />
              ))}
            </div>
          </div>
        )
      )}

      {/* Generate Section */}
      <div className="generate-section">
        <div className="generate-section-info">
          <div className="generate-section-title">
            {existingOutput ? '↻ Regenerate Strategy Output' : '⚡ Generate Strategy Output'}
          </div>
          <div className="generate-section-desc">
            {existingOutput
              ? 'You have a saved output. Regenerating will replace it.'
              : isFirstModule
              ? 'Fill in your business context above, then generate your strategic foundation.'
              : 'The AI will use your business context plus all prior strategy outputs.'
            }
          </div>
        </div>

        {isGenerating ? (
          <button className="btn-generate" onClick={handleAbort} style={{ background: 'linear-gradient(135deg, #c0392b, #96281b)' }}>
            <div className="spinner" />
            Stop Generation
          </button>
        ) : (
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={isFirstModule && !localCtx.brandName?.trim()}
          >
            <span>✨</span>
            {existingOutput ? 'Regenerate' : 'Generate'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(192,57,43,0.08)',
          border: '1px solid rgba(192,57,43,0.25)',
          borderRadius: 'var(--radius-md)',
          color: '#c0392b',
          fontSize: '0.85rem',
          marginBottom: 16,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Output */}
      <OutputBlock
        moduleId={module.id}
        output={existingOutput}
        isStreaming={isGenerating}
        streamingText={streamingText}
        onEditSave={(val) => saveEditedOutput(module.id, val)}
      />

      {/* Bottom Navigation */}
      <div className="module-nav-footer">
        <button
          className="btn-nav"
          onClick={() => setCurrentModule(Math.max(0, moduleIndex - 1))}
          disabled={moduleIndex === 0}
          style={{ opacity: moduleIndex === 0 ? 0 : 1 }}
        >
          ← Previous
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {moduleIndex + 1} of {MODULES.length}
        </span>

        <button
          className={`btn-nav ${moduleIndex < MODULES.length - 1 ? 'btn-nav-next' : ''}`}
          onClick={() => {
            if (moduleIndex < MODULES.length - 1) {
              setCurrentModule(moduleIndex + 1);
            }
          }}
          disabled={moduleIndex === MODULES.length - 1}
          style={{ opacity: moduleIndex === MODULES.length - 1 ? 0 : 1 }}
        >
          Next Module →
        </button>
      </div>
    </div>
  );
}
