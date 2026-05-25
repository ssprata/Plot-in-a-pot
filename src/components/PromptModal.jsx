import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PromptModal({ isOpen, title, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-80 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        <h3 className="font-black uppercase text-sm mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
        <input 
          autoFocus
          className="w-full p-2 mb-4 border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 font-bold text-xs uppercase border-2 border-gray-900 dark:border-gray-200 hover:bg-gray-200">{t('common.cancel')}</button>
          <button onClick={() => onConfirm(value)} className="px-3 py-1 font-black text-xs uppercase border-2 border-gray-900 bg-black text-white hover:bg-gray-800">{t('common.yes')}</button>
        </div>
      </div>
    </div>
  );
}