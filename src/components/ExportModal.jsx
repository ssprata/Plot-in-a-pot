// src/components/ExportModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ExportModal({ isOpen, onClose, languages, onConfirm }) {
  const { t } = useTranslation();
  
  // Define 'keys' como a opção padrão de exportação do sistema
  const [selectedTarget, setSelectedTarget] = useState('keys');

  // Faz reset à seleção sempre que o modal abre
  useEffect(() => {
    if (isOpen) setSelectedTarget('keys');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-950/70 font-sans p-4">
      {/* Caixa do Modal Neo-Brutalista */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] transition-all">
        
        {/* Título */}
        <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white border-b-4 border-gray-900 dark:border-gray-700 pb-2 mb-4">
          {t('exportModal.title', 'Export Twee Story')}
        </h3>
        
        {/* Descrição */}
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-4 leading-relaxed">
          {t('exportModal.description', 'Selecione o formato de compilação para o ficheiro final do Twine (.twee):')}
        </p>

        {/* Form Group / Dropdown */}
        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            {t('exportModal.selectLabel', 'Target Compile Format:')}
          </label>
          
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 font-mono text-xs font-bold uppercase border-2 border-gray-900 dark:border-gray-700 outline-none cursor-pointer focus:border-yellow-500 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]"
          >
            {/* Opção do ficheiro de desenvolvimento estruturado em chaves */}
            <option value="keys">
              {t('exportModal.optionKeys', 'KEYS DATABASE -> t("...") format')}
            </option>
            
            {/* Opções das linguagens de runtime injetadas dinamicamente */}
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {t('exportModal.optionMonolingual', 'MONOLINGUAL STORY -> {{lang}} format').replace('{{lang}}', lang.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Painel de Botões de Ação */}
        <div className="flex justify-end gap-3 border-t-2 border-gray-100 dark:border-gray-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-900 dark:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm(selectedTarget);
              onClose();
            }}
            className="px-4 py-2 border-2 border-gray-900 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            {t('exportModal.confirmButton', 'Export File')}
          </button>
        </div>

      </div>
    </div>
  );
}