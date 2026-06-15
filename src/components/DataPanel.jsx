import React, { useState } from 'react';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// Importação oficial para o motor de traduções
import { useTranslation } from 'react-i18next';

export default function DataPanel({
  exportToTwine, importText, setImportText, handleImport, importError,
  adjacencyList, showAdjacencyList, runValidation, validationErrors,
  runSimulationLog, showFlowErrors, showSimulationLegacy, parserWarnings,
  validationResult,
  activeStep // ADICIONADO
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const { showInfoPopout } = useInfoPopout();

  const { t } = useTranslation();

  const isTutorialActive = !!activeStep;
  const isValidateDisabled = isTutorialActive && activeStep?.highlightButton !== 'validate';
  const isMatrixDisabled = isTutorialActive;
  const isExportDisabled = isTutorialActive;
  const isImportDisabled = isTutorialActive;

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer text-xs";

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

  const panelWidthClass = isExpanded ? 'w-[360px]' : 'w-12';

  return (
    <div className={`relative transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col h-full shadow-inner ${panelWidthClass}`}>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-4 z-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
      >
        {isExpanded ? '→' : '←'}
      </button>

      <div className={`flex flex-col h-full p-4 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="mt-0 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4 text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">
          {t('dataPanel.title')}
        </h3>

        {/* --- CONTEÚDO ÚNICO E DIRETO --- */}
        <div className="flex-1 overflow-y-auto space-y-4">
          
          {/* BOTÃO ADICIONADO: Ponto de entrada limpo para a matriz de tradução geral */}
          <button 
            onClick={() => {
              if (!isMatrixDisabled) window.dispatchEvent(new Event('triggerMatrixToggle'));
            }}
            disabled={isMatrixDisabled}
            className={`w-full p-3 border-2 border-gray-900 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer ${
              isMatrixDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('dataPanel.translationTableTitle')}
          </button>

          <button
            onClick={exportToTwine}
            disabled={isExportDisabled}
            className={`w-full p-3 border-2 border-gray-900 dark:border-gray-200 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors rounded shadow-md ${
              isExportDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('dataPanel.export')}
          </button>

          <div className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase">{t('dataPanel.importTitle')}</div>
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
              className={`w-full font-mono text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 outline-none focus:ring-1 focus:ring-indigo-500 ${dragActive ? 'ring-2 ring-indigo-400 border-indigo-400' : ''}`}
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
              className={`w-full mt-2 p-2 border-2 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 font-bold text-xs uppercase transition-all ${
                isImportDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              {t('dataPanel.importButton')}
            </button>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              onClick={runValidation}
              disabled={isValidateDisabled}
              className={`flex-1 p-3 border-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:!font-black bg-yellow-400 hover:bg-yellow-500 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none ${
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
              className="w-12 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:shadow-none cursor-pointer"
            >
              ?
            </button>
          </div>

          {/* --- EXIBIÇÕES DE MONITORIZAÇÃO E ERROS --- */}
          {parserWarnings?.length > 0 && (
            <div className="p-3 bg-orange-950 text-orange-100 rounded border-2 border-orange-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-orange-400">{t('dataPanel.syntaxWarnings')}</h4>
              <ul className="text-[9px] space-y-3 uppercase font-mono leading-tight">
                {parserWarnings.map((warn, i) => <li key={i} className="border-b border-orange-800 pb-3 last:border-0 text-orange-200"><span className="font-bold text-orange-500 mr-2">[!]</span>{warn}</li>)}
              </ul>
            </div>
          )}

          {validationResult?.orphanNodes?.length > 0 && (
            <div className="p-3 bg-orange-950 text-orange-100 rounded border-2 border-orange-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-orange-400">
                {t('dataPanel.unreachableNodes')} {validationResult.orphanNodes.length}
              </h4>
              <ul className="text-[9px] space-y-2 uppercase font-mono leading-tight">
                {validationResult.orphanNodes.map((node, i) => <li key={i} className="border-b border-orange-800 pb-2 last:border-0 text-orange-200"><span className="font-bold text-orange-500 mr-2">[ÓRFÃO]</span>{node.label}</li>)}
              </ul>
            </div>
          )}

          {validationResult && !validationResult.hasReachableEnd && validationResult.unreachableEdges.length === 0 && (
            <div className="p-3 bg-yellow-900 text-yellow-100 rounded border-2 border-yellow-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
              <h4 className="font-bold text-[10px] uppercase mb-1 underline tracking-tighter text-yellow-400">{t('dataPanel.noEndDetected')}</h4>
            </div>
          )}

          {validationResult?.hasReachableEnd && (
            <div className="p-3 bg-green-900 text-green-100 rounded border-2 border-green-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter text-green-400">
                {t('dataPanel.reachableEnds')} {validationResult.reachableEndNodes.length}
              </h4>
              <ul className="text-[9px] space-y-2 uppercase font-mono leading-tight">
                {validationResult.reachableEndNodes.map((endNode, i) => <li key={i} className="border-b border-green-800 pb-2 last:border-0"><span className="text-green-400 font-bold mr-2">✓</span><span className="text-white">{endNode.label}</span></li>)}
              </ul>
            </div>
          )}

          {showFlowErrors && validationErrors?.length > 0 && (
            <div className="p-3 bg-red-900 text-red-100 rounded border-2 border-red-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
              <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter">{t('dataPanel.flowErrors')}</h4>
              <ul className="text-[9px] space-y-4 uppercase font-mono leading-tight">
                {validationErrors.map((err, i) => <li key={i} className="border-b border-red-800 pb-3 last:border-0"><div className="mb-1 text-sm">{err.sourceLabel} → {err.targetLabel}</div></li>)}
              </ul>
            </div>
          )}

          {showAdjacencyList && (
            <div className="w-full min-h-0 flex flex-col pt-2">
              <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-600 pb-1 mb-2">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">{t('dataPanel.adjacencyList')}</h4>
              </div>
              <div className="w-full font-mono text-[10px] bg-gray-900 text-green-400 p-3 rounded shadow-inner overflow-y-auto max-h-[150px]">
                {Object.keys(adjacencyList).map((id) => (
                  <div key={id} className="mb-1"><span className="text-blue-400">$ {id}:</span> [{(adjacencyList[id] || []).join(', ')}]</div>
                ))}
              </div>
            </div>
          )}

          {showSimulationLegacy && (
            <div className="pt-2">
              <button onClick={runSimulationLog} className="w-full p-2 border-2 border-gray-800 bg-gray-800 text-white hover:bg-black font-mono text-[10px] uppercase tracking-tighter transition-all shadow-[2px_2px_0px_#ccc] active:shadow-none">
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