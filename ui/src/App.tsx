import { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import { SimulationHarness, type AgentChoice, type SimulationResult, isLiveLLM } from './engine.ts';
import { Header } from './components/Header.tsx';
import { ScenarioSidebar } from './components/ScenarioSidebar.tsx';
import { ScenarioViewer } from './components/ScenarioViewer.tsx';
import { TraceViewer } from './components/TraceViewer.tsx';
import { WorldDiffViewer } from './components/WorldDiffViewer.tsx';
import { BatchOverview } from './components/BatchOverview.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';

export function App() {
  const harness = useMemo(() => new SimulationHarness(), []);
  const scenarios = useMemo(() => harness.getScenarios(), [harness]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>('S01');
  const [selectedVariant, setSelectedVariant] = useState<string>('base');
  const [selectedAgent, setSelectedAgent] = useState<AgentChoice>('first_account');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return !!(localStorage.getItem('APINEX_API_KEY') || '').trim();
  });
  const [, startTransition] = useTransition();

  const currentScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  const currentCases = useMemo(() => {
    return harness.getCasesForScenario(activeScenarioId);
  }, [harness, activeScenarioId]);

  const currentCase = useMemo(() => {
    return currentCases.find(c => c.variant === selectedVariant) || currentCases[0];
  }, [currentCases, selectedVariant]);

  const runIdRef = useRef<number>(0);

  // Execute simulation whenever current case or agent changes with stale-result protection
  const runSimulation = async (targetCase = currentCase, agent = selectedAgent) => {
    const runId = ++runIdRef.current;
    setIsRunning(true);
    setExecutionError(null);
    try {
      const res = await harness.runSingle(targetCase, agent);
      if (runIdRef.current === runId) {
        setResult(res);
      }
    } catch (err: any) {
      if (runIdRef.current === runId) {
        if (err.message === 'NO_API_KEY_CONFIGURED') {
          setIsApiKeyModalOpen(true);
        } else {
          setExecutionError(err.message || 'Simulation execution failed');
          console.error('Simulation error:', err);
        }
      }
    } finally {
      if (runIdRef.current === runId) {
        setIsRunning(false);
      }
    }
  };

  useEffect(() => {
    if (currentCase) {
      runSimulation(currentCase, selectedAgent);
    }
  }, [activeScenarioId, selectedVariant, selectedAgent]);

  const handleSelectScenario = (id: string) => {
    startTransition(() => {
      setActiveScenarioId(id);
      setSelectedVariant('base');
      setIsBatchMode(false);
    });
  };

  const handleQuickCompare = () => {
    // Toggle variant; useEffect automatically triggers exactly one execution without race conditions
    setSelectedVariant(prev => prev === 'base' ? 'reverse_accounts' : 'base');
  };

  const handleKeySaved = (key: string) => {
    setHasApiKey(!!key.trim());
    if (key.trim() && isLiveLLM(selectedAgent)) {
      runSimulation(currentCase, selectedAgent);
    }
  };

  return (
    <div className="app-container">
      <Header 
        onOpenBatch={() => setIsBatchMode(!isBatchMode)}
        isBatchMode={isBatchMode}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={hasApiKey}
      />

      {isBatchMode ? (
        <BatchOverview 
          onRunBatch={(onProgress) => harness.runAll(onProgress)}
          onBack={() => setIsBatchMode(false)}
        />
      ) : (
        <div className="main-layout">
          <ScenarioSidebar 
            scenarios={scenarios}
            activeId={activeScenarioId}
            onSelect={handleSelectScenario}
          />

          <main className="content-area">
            {executionError && (
              <div style={{
                margin: '12px 16px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⚠️ {executionError}</span>
                <button 
                  onClick={() => setExecutionError(null)}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
                >✕</button>
              </div>
            )}
            {currentScenario && currentCase && (
              <>
                <ScenarioViewer 
                  scenario={currentScenario}
                  cases={currentCases}
                  selectedVariant={selectedVariant}
                  onVariantChange={setSelectedVariant}
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  onRun={() => runSimulation()}
                  isRunning={isRunning}
                  onQuickCompare={handleQuickCompare}
                  hasApiKey={hasApiKey}
                  onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                />

                {result && (
                  <>
                    <TraceViewer 
                      result={result}
                      targetAccountId={currentScenario.oracle.target_account_id}
                      onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                    />

                    <WorldDiffViewer 
                      initialWorld={currentCase.scenario.world}
                      finalWorld={result.final_world}
                      targetAccountId={currentScenario.oracle.target_account_id}
                    />
                  </>
                )}
              </>
            )}
          </main>
        </div>
      )}

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </div>
  );
}

export default App;
