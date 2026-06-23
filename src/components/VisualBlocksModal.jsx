// src/components/VisualBlocksModal.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import VisualBlocksEditor from './VisualBlocksEditor';
import { parseLogicFromText } from '../utils/logicParser';

export default function VisualBlocksModal({
  isOpen,
  onClose,
  selectedNode,
  nodes,
  globalVars,
  updateSelectedNode,
  syncChoicesFromText
}) {
  const { t } = useTranslation();

  const parsed = useMemo(() => {
    return parseLogicFromText(selectedNode?.data.content || '');
  }, [selectedNode?.data.content]);

  const hasEmptyChoiceText = useMemo(() => {
    return parsed.choices.some(c => !c.text || c.text.trim() === '');
  }, [parsed.choices]);

  const handleClose = () => {
    if (hasEmptyChoiceText) return;
    onClose();
  };

  if (!isOpen || !selectedNode) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 shadow-[12px_12px_0px_#000] dark:shadow-[12px_12px_0px_#fff] flex flex-col w-[1100px] max-w-[96vw] max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b-4 border-gray-900 dark:border-gray-100 bg-yellow-400 dark:bg-yellow-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h2 className="font-black uppercase tracking-widest text-gray-900 text-sm leading-none">
                {t('visualBlocks.modalTitle', 'Editor de Lógica Visual')}
              </h2>
              <span className="font-mono text-[10px] text-gray-700 uppercase tracking-wider">
                {selectedNode.data.nodeType === 'choice' ? '📄' : '⚙️'}&nbsp;
                {selectedNode.data.label || selectedNode.id}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={hasEmptyChoiceText}
            className={`w-9 h-9 flex items-center justify-center border-2 font-black text-lg transition-all rounded-none ${
              hasEmptyChoiceText
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0'
                : 'border-gray-900 bg-white dark:bg-gray-800 hover:bg-red-600 hover:text-white hover:border-red-700 text-gray-900 dark:text-gray-100 shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
            }`}
            aria-label="Fechar editor"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-gray-950">
          <VisualBlocksEditor
            selectedNode={selectedNode}
            nodes={nodes}
            globalVars={globalVars}
            updateSelectedNode={updateSelectedNode}
            syncChoicesFromText={syncChoicesFromText}
            fullscreen
          />
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-3 border-t-4 border-gray-900 dark:border-gray-100 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div>
            {hasEmptyChoiceText && (
              <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-pulse">
                ⚠️ {t('visualBlocks.emptyChoiceWarning', 'Existem escolhas sem título')}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={hasEmptyChoiceText}
            className={`px-6 py-2 border-2 font-black uppercase text-xs tracking-widest transition-all rounded-none ${
              hasEmptyChoiceText
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-400 dark:border-gray-600 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0'
                : 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:bg-gray-700 dark:hover:bg-gray-300 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
            }`}
          >
            {t('common.close', 'Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}
