import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ValidationModal({ isOpen, onClose, result }) {
  const { t } = useTranslation();

  if (!isOpen || !result) return null;

  const hasErrors = result.unreachableEdges.length > 0 || result.orphanNodes.length > 0 || !result.hasReachableEnd;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-[420px] shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="border-b-2 border-gray-900 dark:border-gray-200 pb-2 mb-4">
          <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">
            {t('dataPanel.validateLogic', 'Validar Lógica')}
          </h2>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {hasErrors ? (
            <div className="border-2 border-gray-900 dark:border-gray-200 bg-red-100 dark:bg-red-950 p-4 rounded-none shadow-[4px_4px_0px_#ef4444] text-red-900 dark:text-red-100">
              <h3 className="font-black uppercase text-sm mb-2 flex items-center gap-2">
                <span>⚠</span> {t('validationModal.statusProblems', 'Problemas Detetados')}
              </h3>
              <p className="text-xs leading-normal">
                {t('validationModal.problemsDescription', 'Foram detetados problemas ou inconsistências no fluxo lógico do teu projeto.')}
              </p>
            </div>
          ) : (
            <div className="border-2 border-gray-900 dark:border-gray-200 bg-green-100 dark:bg-green-950 p-4 rounded-none shadow-[4px_4px_0px_#10b981] text-green-900 dark:text-green-100">
              <h3 className="font-black uppercase text-sm mb-2 flex items-center gap-2">
                <span>✓</span> {t('validationModal.statusOk', 'Estrutura Válida')}
              </h3>
              <p className="text-xs leading-normal">
                {t('validationModal.successDescription', 'Parabéns! A estrutura do teu grafo é lógica, conectada e tem finais acessíveis.')}
              </p>
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-3">
            {/* End Nodes */}
            <div className="border-2 border-gray-900 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-950">
              <span className="block font-black text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                {t('validationModal.reachableEnds', 'Finais Acessíveis')}
              </span>
              {result.reachableEndNodes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.reachableEndNodes.map((end, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 border border-gray-900 dark:border-gray-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-bold text-[10px] uppercase shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]"
                    >
                      {end.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-red-500 font-bold uppercase">
                  {t('validationModal.noEnds', 'Nenhum final acessível detetado!')}
                </span>
              )}
            </div>

            {/* Blocked Routes */}
            {result.unreachableEdges.length > 0 && (
              <div className="border-2 border-gray-900 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-950">
                <span className="block font-black text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                  {t('dataPanel.flowErrors', 'Caminhos Bloqueados')}
                </span>
                <ul className="text-[10px] font-mono leading-tight space-y-1 text-red-500 font-semibold uppercase">
                  {result.unreachableEdges.map((edge, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span>✗</span> {edge.sourceLabel} → {edge.targetLabel}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Orphan Nodes */}
            {result.orphanNodes.length > 0 && (
              <div className="border-2 border-gray-900 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-950">
                <span className="block font-black text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  {t('dataPanel.unreachableNodes', 'Nós Órfãos')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.orphanNodes.map((node, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 border border-gray-950 dark:border-gray-500 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 font-bold text-[10px] uppercase shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]"
                    >
                      {node.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <button
          onClick={onClose}
          className="w-full mt-6 p-2 border-2 border-gray-900 bg-gray-950 text-white font-bold uppercase text-xs hover:bg-gray-850 dark:border-gray-200 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 transition-all shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          {t('common.close', 'Fechar')}
        </button>

      </div>
    </div>
  );
}
