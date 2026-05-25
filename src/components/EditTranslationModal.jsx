import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function EditTranslationModal({ isOpen, onClose, onSave, editData, sourceValue, sourceLang }) {
    const [value, setValue] = useState('');
    const { t } = useTranslation();

    // Resetar o estado interno sempre que o utilizador abrir uma célula diferente
    useEffect(() => {
        if (isOpen && editData) {
            setValue(editData.value || '');
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    // Verificar se o utilizador está a traduzir a própria língua base
    const isEditingSource = editData?.lang === sourceLang;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-[450px] shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">

                <div className="mb-4 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                    <h3 className="font-black uppercase text-xs text-gray-400 dark:text-gray-500 mb-1">
                        {t('dataPanel.editTitle')} / {editData?.key}
                    </h3>
                    <span className="px-2 py-0.5 bg-black text-white dark:bg-gray-200 dark:text-gray-900 font-black uppercase text-[10px]">
                        Target: {editData?.lang?.toUpperCase()}
                    </span>
                </div>

                {/* PAINEL DE REFERÊNCIA: Mostra o texto original se não estivermos a editar a língua base */}
                {!isEditingSource && (
                    <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-400 dark:border-gray-700">
                        <span className="block text-[9px] font-black uppercase text-gray-500 mb-1">
                            Reference ({sourceLang?.toUpperCase()}):
                        </span>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-words max-h-20 overflow-y-auto">
                            {sourceValue || <span className="italic opacity-50">Empty reference text</span>}
                        </p>
                    </div>
                )}

                {/* CAMPO DE EDIÇÃO */}
                <textarea
                    autoFocus
                    className="w-full h-32 p-2 mb-4 border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-yellow-400"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={!isEditingSource && sourceValue ? sourceValue : t('dataPanel.translationPlaceholder')}
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 font-bold text-xs uppercase border-2 border-gray-900 dark:border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onSave(value);
                            onClose();
                        }}
                        className="px-3 py-1 font-black text-xs uppercase border-2 border-gray-900 bg-black text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                        {t('common.yes')}
                    </button>
                </div>
            </div>
        </div>
    );
}