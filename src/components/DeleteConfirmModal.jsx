import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, message }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs font-sans">
      {/* Contentor do Modal Neo-Brutalista */}
      <div className="w-full max-w-xs bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-4 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
        
        {/* Título do Modal */}
        <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 border-b-2 border-gray-900 dark:border-gray-700 pb-1 mb-2">
          {t('common.deleteConfirm.title', 'Confirm Deletion')}
        </h4>
        
        {/* Mensagem descritiva injetada dinamicamente */}
        <p className="text-xs font-mono mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          {message || t('common.deleteConfirm.message', 'Are you sure you want to delete this item? This action cannot be undone.')}
        </p>
        
        {/* Ações Brutalistas */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 border-2 border-gray-900 dark:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-bold text-[10px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-2.5 py-1.5 border-2 border-gray-900 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
          >
            {t('common.deleteConfirm.confirm', 'Delete')}
          </button>
        </div>

      </div>
    </div>
  );
}