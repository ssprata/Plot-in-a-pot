import React from 'react';
// 1. Importação atualizada para usar o motor oficial
import { useTranslation } from 'react-i18next';

export default function Popout({ isOpen, onClose, title, subtitle, children }) {
  // 2. O Hook tem de estar sempre no topo e usar o 'useTranslation'
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-6 border-b-2 border-gray-900 dark:border-gray-100">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-black leading-none text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label={t('popout.close')}
          >
            ×
          </button>
        </div>

        <div className="p-6 text-gray-700 dark:text-gray-200 space-y-4">
          {children}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold uppercase tracking-widest transition-colors hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            {t('popout.close')}
          </button>
        </div>
      </div>
    </div>
  );
}