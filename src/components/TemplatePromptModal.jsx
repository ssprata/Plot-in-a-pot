import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TemplatePromptModal({ isOpen, onClose, onLoadBaseTemplate }) {
  const [showInstructions, setShowInstructions] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleYes = async () => {
    if (onLoadBaseTemplate) {
      await onLoadBaseTemplate();
    }
    setShowInstructions(true);
  };

  const handleNo = () => {
    // Set cookie to true so it doesn't show again
    document.cookie = "seen-template-prompt=true; max-age=31536000; path=/";
    onClose();
  };

  const handleGotIt = () => {
    // Set cookie to true so it doesn't show again
    document.cookie = "seen-template-prompt=true; max-age=31536000; path=/";
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        
        {!showInstructions ? (
          <>
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-700 pb-2 mb-4">
              {t('templatePrompt.title', 'Base Template Prompt')}
            </h4>
            
            <p className="text-xs font-mono mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('templatePrompt.question', 'Do you want to see a base template?')}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleNo}
                className="px-4 py-2 border-2 border-gray-900 dark:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-bold text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                {t('templatePrompt.no', 'No')}
              </button>
              
              <button
                type="button"
                onClick={handleYes}
                className="px-4 py-2 border-2 border-gray-900 bg-black text-white dark:bg-gray-100 dark:text-gray-900 font-black text-xs uppercase shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                {t('templatePrompt.yes', 'Yes')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-700 pb-2 mb-4">
              {t('templatePrompt.instructionsTitle', 'Where to Place a Template')}
            </h4>
            
            <p className="text-xs font-mono mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('templatePrompt.instructionsLine1', 'To add or configure a base template, you can edit the initialNodes array in:')}
            </p>
            <p className="text-xs font-mono p-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 mb-4 text-gray-900 dark:text-gray-200">
              <a href="file:///home/miguexyz/Documentos/DEV/PiaP/Plot-in-a-pot/src/App.jsx#L61-L68" className="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                src/App.jsx (lines 61-68)
              </a>
            </p>
            <p className="text-xs font-mono mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('templatePrompt.instructionsLine2', 'This array defines the initial structure of nodes loaded when the local storage workspace is empty (or reset). You can customize it with your own default passages, text templates, or styling settings.')}
            </p>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGotIt}
                className="px-4 py-2 border-2 border-gray-900 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                {t('templatePrompt.gotIt', 'Got it!')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
