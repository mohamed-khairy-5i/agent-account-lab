import { useState, useEffect, useMemo, useTransition } from 'react';
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

  // Execute simulation whenever current case or agent changes
  const runSimulation = async (targetCase = currentCase, agent = selectedAgent) => {
    setIsRunning(true);
    try {
      const res = await harness.runSingle(targetCase, agent);
      setResult(res);
    } catch (err: any) {
      if (err.message === 'NO_API_KEY_CONFIGURED') {
        setIsApiKeyModalOpen(true);
      } else {
        console.error('Simulation error:', err);
      }
    } finally {
      setIsRunning(false);
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

  const handleQuickCompare = async () => {
    // Toggle between base and reverse_accounts
    const nextVariant = selectedVariant === 'base' ? 'reverse_accounts' : 'base';
    setSelectedVariant(nextVariant);
    const target = currentCases.find(c => c.variant === nextVariant);
    if (target) {
      await runSimulation(target, selectedAgent);
    }
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
