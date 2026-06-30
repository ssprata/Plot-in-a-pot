import React, { useState, useRef, useCallback } from 'react';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// Importação oficial para o motor de traduções
import { useTranslation } from 'react-i18next';

export default function DataPanel({
  exportToTwine, importText, setImportText, handleImport, importError,
  adjacencyList, showAdjacencyList, runValidation, validationErrors,
  runSimulationLog, showFlowErrors, showSimulationLegacy, parserWarnings,
  validationResult,
  activeStep, // ADICIONADO
  openPlayMode,
  nodes = [],
  settings = {},
  toggleSetting = () => {}
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const { showInfoPopout } = useInfoPopout();

  const sidebarRef = useRef(null);
  const [width, setWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : 360;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const nextWidth = Math.max(220, Math.min(700, startWidth - deltaX));
      console.log('[DataPanel Drag]', { deltaX, nextWidth, clientX: mouseMoveEvent.clientX, startX, startWidth });
      setWidth(nextWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, []);

  const { t } = useTranslation();

  const isTutorialActive = !!activeStep;
  const isValidateDisabled = isTutorialActive && activeStep?.highlightButton !== 'validate';
  const isMatrixDisabled = isTutorialActive;
  const isExportDisabled = isTutorialActive;
  const isImportDisabled = isTutorialActive;
  const isPlayDisabled = isTutorialActive && !activeStep?.allowPlay;

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  const helpButtonClass = "w-5 h-5 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-yellow-400 dark:hover:bg-yellow-400 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-[9px]";

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.name.endsWith('.twee')) {
      const reader = new FileReader();
      reader.onload = (event) => setImportText(event.target.result);
      reader.readAsText(file);
    }
  };

  const getNodeLabel = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? (node.data?.label || nodeId) : nodeId;
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: isExpanded ? `${width}px` : '48px' }}
      className={`relative border-l-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full shadow-md shrink-0 ${
        isResizing ? '' : 'transition-all duration-300 ease-in-out'
      }`}
    >
      {/* Resize Handle (only active/visible when expanded) */}
      {isExpanded && (
        <div
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 transition-colors duration-150 ${
            isResizing ? 'bg-yellow-400 dark:bg-yellow-500' : 'hover:bg-yellow-400/80 dark:hover:bg-yellow-500/80'
          }`}
        />
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-4 z-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
      >
        {isExpanded ? '→' : '←'}
      </button>

      <div className={`flex flex-col h-full p-4 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="mt-0 border-b-2 border-gray-900 dark:border-gray-750 pb-3 mb-4 text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center">
          <span className="inline-flex w-5 h-5 items-center justify-center bg-indigo-600 text-white mr-2 border border-gray-900 dark:border-indigo-400 shadow-[1px_1px_0px_#000] text-xs font-bold font-mono">→</span>
          {t('dataPanel.title', 'DATA ENGINE').toUpperCase()}
        </h3>

        {/* --- CONTEÚDO ÚNICO E DIRETO --- */}
        <div className="flex-1 overflow-y-auto space-y-4">
          
          {/* PLAY MODE BUTTON */}
          <button 
            onClick={openPlayMode}
            disabled={isPlayDisabled}
            className={`w-full p-3 border-2 border-gray-900 dark:border-gray-200 bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer flex items-center justify-center gap-2 ${
              isPlayDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            } ${activeStep?.highlightButton === 'play' ? 'tutorial-btn-flash' : ''}`}
          >
            {t('topBar.play', 'Play')}
          </button>

          {/* SIMULATION ON VALIDATION TOGGLE */}
          <div className="flex items-center justify-between p-2.5 border-2 border-gray-900 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] uppercase text-gray-900 dark:text-gray-100">
                {t('dataPanel.showSimulationOnValidation', 'Ver Simulação ao Validar')}
              </span>
            </div>
            <button
              onClick={() => toggleSetting('showSimulationOnValidation')}
              className={`w-10 h-5 border-2 border-gray-900 dark:border-gray-200 transition-colors relative cursor-pointer ${
                settings.showSimulationOnValidation ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-3.5 h-3.5 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${
                  settings.showSimulationOnValidation ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* BOTÃO ADICIONADO: Ponto de entrada limpo para a matriz de tradução geral */}
          <button 
            onClick={() => {
              if (!isMatrixDisabled) window.dispatchEvent(new Event('triggerMatrixToggle'));
            }}
            disabled={isMatrixDisabled}
            className={`w-full p-3 border-2 border-gray-900 dark:border-gray-200 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer ${
              isMatrixDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('dataPanel.translationTableTitle')}
          </button>

          <button
            onClick={exportToTwine}
            disabled={isExportDisabled}
            className={`w-full p-3 border-2 border-gray-900 dark:border-gray-200 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer ${
              isExportDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('dataPanel.export')}
          </button>

          <div className="border-2 border-gray-900 dark:border-gray-700 bg-gray-100/55 dark:bg-gray-950 p-4 rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-wider">{t('dataPanel.importTitle')}</div>
              <button
                type="button"
                onClick={() => openHelp(
                  t('dataPanel.importHelpTitle'),
                  t('dataPanel.importHelpSubtitle'),
                  <div className="space-y-2">
                    <p>{t('dataPanel.importHelpLine1')}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>{t('dataPanel.importHelpBullet1')}</li>
                      <li>{t('dataPanel.importHelpBullet2')}</li>
                    </ul>
                    <p className="text-red-600 font-bold mt-2">{t('dataPanel.importHelpWarning')}</p>
                  </div>
                )}
                className={helpButtonClass}
              >
                ?
              </button>
            </div>
            
            <textarea
              rows={4}
              className={`w-full font-mono text-xs p-2.5 border-2 border-gray-900 dark:border-gray-700 rounded-none bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-colors shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] ${dragActive ? 'ring-2 ring-indigo-400 border-indigo-400' : ''}`}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              placeholder={t('dataPanel.placeholder')}
            />
            
            <button
              onClick={handleImport}
              disabled={isImportDisabled}
              className={`w-full mt-2.5 p-2 border-2 border-gray-900 dark:border-gray-200 bg-gray-900 dark:bg-transparent hover:bg-gray-800 dark:hover:bg-gray-900 text-white dark:text-white font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer ${
                isImportDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              {t('dataPanel.importButton')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runValidation}
              disabled={isValidateDisabled}
              className={`flex-1 p-3 border-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:!font-black bg-yellow-400 hover:bg-yellow-300 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none rounded-none ${
                isValidateDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              } ${activeStep?.highlightButton === 'validate' ? 'tutorial-btn-flash' : ''}`}
            >
              {t('dataPanel.validateLogic')}
            </button>
            <button
              type="button"
              onClick={() => openHelp(
                t('dataPanel.validationHelp.title'),
                t('dataPanel.validationHelp.subtitle'),
                <div className="space-y-2">
                  <p>{t('dataPanel.validationHelp.line1')}</p>
                  <p>{t('dataPanel.validationHelp.line2')}</p>
                  <br />
                  <p><strong>{t('dataPanel.validationHelp.hotkeyLabel')}</strong></p>
                </div>
              )}
              className={helpButtonClass}
            >
              ?
            </button>
          </div>

          {/* --- EXIBIÇÕES DE MONITORIZAÇÃO E ERROS --- */}
          {parserWarnings?.length > 0 && (
            <div className="p-3 bg-orange-950 text-orange-100 rounded-none border-2 border-orange-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-orange-400">{t('dataPanel.syntaxWarnings')}</h4>
              <ul className="text-[9px] space-y-3 uppercase font-mono leading-tight">
                {parserWarnings.map((warn, i) => <li key={i} className="border-b border-orange-800 pb-3 last:border-0 text-orange-200"><span className="font-bold text-orange-500 mr-2">[!]</span>{warn}</li>)}
              </ul>
            </div>
          )}

          {validationResult?.orphanNodes?.length > 0 && (
            <div className="p-3 bg-orange-950 text-orange-100 rounded-none border-2 border-orange-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-orange-400">
                {t('dataPanel.unreachableNodes')} {validationResult.orphanNodes.length}
              </h4>
              <ul className="text-[9px] space-y-2 uppercase font-mono leading-tight">
                {validationResult.orphanNodes.map((node, i) => <li key={i} className="border-b border-orange-800 pb-2 last:border-0 text-orange-200"><span className="font-bold text-orange-500 mr-2">[ÓRFÃO]</span>{node.label}</li>)}
              </ul>
            </div>
          )}

          {validationResult && !validationResult.hasReachableEnd && validationResult.unreachableEdges.length === 0 && (
            <div className="p-3 bg-yellow-900 text-yellow-100 rounded-none border-2 border-yellow-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
              <h4 className="font-bold text-[10px] uppercase mb-1 underline tracking-tighter text-yellow-400">{t('dataPanel.noEndDetected')}</h4>
            </div>
          )}

          {validationResult?.hasReachableEnd && (
            <div className="p-3 bg-green-900 text-green-100 rounded-none border-2 border-green-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-green-400">
                {t('dataPanel.reachableEnds')} {validationResult.reachableEndNodes.length}
              </h4>
              <ul className="text-[9px] space-y-2 uppercase font-mono leading-tight">
                {validationResult.reachableEndNodes.map((endNode, i) => <li key={i} className="border-b border-green-800 pb-2 last:border-0"><span className="text-green-400 font-bold mr-2">✓</span><span className="text-white">{endNode.label}</span></li>)}
              </ul>
            </div>
          )}

          {showFlowErrors && validationErrors?.length > 0 && (
            <div className="p-3 bg-red-900 text-red-100 rounded-none border-2 border-red-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter">{t('dataPanel.flowErrors')}</h4>
              <ul className="text-[9px] space-y-4 uppercase font-mono leading-tight">
                {validationErrors.map((err, i) => <li key={i} className="border-b border-red-800 pb-3 last:border-0"><div className="mb-1 text-sm">{err.sourceLabel} → {err.targetLabel}</div></li>)}
              </ul>
            </div>
          )}

          {settings.showSimulationOnValidation && validationResult?.arrivalHistory && (
            <div className="w-full min-h-0 flex flex-col pt-2">
              <div className="flex items-center justify-between border-b border-gray-900 dark:border-gray-200 pb-1 mb-2">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">
                  {t('dataPanel.simulationHistoryTitle', 'Simulation History')}
                </h4>
              </div>
              <div className="w-full font-mono text-[9px] bg-gray-900 text-green-400 p-3 rounded-none border-2 border-gray-900 dark:border-gray-200 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] overflow-y-auto max-h-[220px] space-y-3">
                {(() => {
                  const elements = [];
                  validationResult.arrivalHistory.forEach((histories, nodeId) => {
                    const nodeLabel = getNodeLabel(nodeId);
                    elements.push(
                      <div key={nodeId} className="border-b border-gray-800 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 text-left">
                        <div className="text-yellow-400 font-bold uppercase text-[9px] mb-1">
                          Node: {nodeLabel}
                        </div>
                        <div className="space-y-1.5 pl-2">
                          {histories.map((hist, idx) => {
                            const stateKeys = Object.keys(hist.state || {});
                            return (
                              <div key={idx} className="bg-gray-950 p-1.5 border border-gray-800 rounded-sm">
                                <div className="text-blue-400 font-semibold mb-0.5">
                                  Route {idx + 1}:
                                </div>
                                <div className="text-gray-300 break-all mb-1 leading-normal">
                                  Path: {hist.path.map(pId => getNodeLabel(pId)).join(' → ')}
                                </div>
                                <div className="text-emerald-400 flex flex-wrap gap-x-2 gap-y-0.5 leading-normal">
                                  <span className="text-gray-500">State:</span>
                                  {stateKeys.length === 0 ? (
                                    <span className="italic text-gray-500">[Empty]</span>
                                  ) : (
                                    stateKeys.map(k => (
                                      <span key={k} className="bg-gray-900 px-1 border border-gray-800 rounded">
                                        {k}: {String(hist.state[k])}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                  return elements.length > 0 ? elements : <div className="italic text-gray-500 text-center">No simulation data.</div>;
                })()}
              </div>
            </div>
          )}

          {showAdjacencyList && (
            <div className="w-full min-h-0 flex flex-col pt-2">
              <div className="flex items-center justify-between border-b border-gray-900 dark:border-gray-200 pb-1 mb-2">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">{t('dataPanel.adjacencyList')}</h4>
              </div>
              <div className="w-full font-mono text-[10px] bg-gray-900 text-green-400 p-3 rounded-none border-2 border-gray-900 dark:border-gray-200 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] overflow-y-auto max-h-[150px]">
                {Object.keys(adjacencyList).map((id) => (
                  <div key={id} className="mb-1"><span className="text-blue-400">$ {id}:</span> [{(adjacencyList[id] || []).join(', ')}]</div>
                ))}
              </div>
            </div>
          )}

          {showSimulationLegacy && (
            <div className="pt-2">
              <button onClick={runSimulationLog} className="w-full p-2 border-2 border-gray-900 dark:border-gray-200 bg-gray-800 dark:bg-gray-700 text-white hover:bg-black font-black text-[10px] uppercase tracking-widest transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer">
                {t('dataPanel.simulateLegacy')}
              </button>
            </div>
          )}
        </div>

        {!isExpanded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="rotate-90 whitespace-nowrap text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{t('dataPanel.collapsedLabel')}</span>
          </div>
        )}
      </div>
    </div>
  );
}