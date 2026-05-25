import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PromptModal from './PromptModal';
import EditTranslationModal from './EditTranslationModal';
// IMPORTAÇÃO DO CONTEXTO DE POPUPS
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function TranslationTable({ translations, setTranslations }) {
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [newLang, setNewLang] = useState('');

    const { t } = useTranslation();
    const sourceLang = translations.languages[0]; // Assumindo que a primeira língua é a base (source)

    const sourceValue = editData ? translations.keys[editData.key]?.[sourceLang] : null;

    // EXTRAÇÃO DO MÉTODO DO POPUP
    const { showInfoPopout } = useInfoPopout();

    const openHelp = (title, subtitle, content) => {
        showInfoPopout({ title, subtitle, content });
    };

    const helpButtonClass = "w-5 h-5 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none cursor-pointer text-[10px]";

    const handleEdit = (key, lang, value) => {
        setTranslations(prev => ({
            ...prev,
            keys: {
                ...prev.keys,
                [key]: { ...prev.keys[key], [lang]: value }
            }
        }));
    };

    const addNewKey = (keyName) => {
        if (!keyName) return;
        setTranslations(prev => ({
            ...prev,
            keys: { ...prev.keys, [keyName]: {} }
        }));
        setIsPromptOpen(false);
    };

    const toggleLanguage = (lang) => {
        setTranslations(prev => {
            if (prev.languages.includes(lang)) {
                const newLanguages = prev.languages.filter(l => l !== lang);
                const newKeys = { ...prev.keys };
                Object.keys(newKeys).forEach(k => delete newKeys[k][lang]);
                return { ...prev, languages: newLanguages, keys: newKeys };
            } else {
                return { ...prev, languages: [...prev.languages, lang] };
            }
        });
    };

    const exportToCSV = () => {
        const { languages, keys } = translations;
        const headers = ['Key', ...languages].join(',');
        const rows = Object.entries(keys).map(([key, langs]) => {
            return [key, ...languages.map(lang => `"${(langs[lang] || '').replace(/"/g, '""')}"`)].join(',');
        });
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translations.csv';
        a.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const [headerLine, ...lines] = text.split('\n');
            const languages = headerLine.split(',').slice(1).map(l => l.trim().toLowerCase());
            const newKeys = {};
            lines.forEach(line => {
                if (!line.trim()) return;
                const [key, ...values] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                newKeys[key] = {};
                languages.forEach((lang, i) => {
                    newKeys[key][lang] = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
                });
            });
            setTranslations({ languages, keys: newKeys });
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    if (!translations || !translations.languages) {
        return <div className="p-4 text-xs italic text-gray-500">A carregar traduções...</div>;
    }

    return (
        <div className="border-2 border-gray-900 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
            <div className="space-y-4">

                {/* Gestão de Línguas com Botão de Ajuda */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="font-black uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400">
                        {t('dataPanel.languagesManagement')}
                    </span>
                    <button
                        type="button"
                        onClick={() => openHelp(
                            t('dataPanel.help.languages.title'),
                            t('dataPanel.help.languages.subtitle'),
                            <div className="space-y-2 text-sm">
                                <p>{t('dataPanel.help.languages.line1')}</p>
                                <p className="text-red-600 font-bold">{t('dataPanel.help.languages.warning')}</p>
                            </div>
                        )}
                        className={helpButtonClass}
                    >?</button>
                </div>

                {/* Botões de Gestão de Línguas */}
                <div className="flex gap-2 flex-wrap items-center">
                    {translations.languages.map(lang => (
                        <button
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className="px-2 py-1 text-[10px] font-bold uppercase border-2 bg-black text-white dark:bg-gray-100 dark:text-gray-900 border-gray-900 transition-transform active:translate-y-0.5"
                            title={t('dataPanel.removeLanguageHint')}
                        >
                            {lang.toUpperCase()} ×
                        </button>
                    ))}

                    <div className="flex border-2 border-gray-900 dark:border-gray-600">
                        <input
                            className="w-12 p-1 text-[10px] uppercase bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-gray-100"
                            placeholder="Ex: CZ"
                            value={newLang}
                            onChange={(e) => setNewLang(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={() => {
                                if (newLang && !translations.languages.includes(newLang)) {
                                    toggleLanguage(newLang);
                                    setNewLang('');
                                }
                            }}
                            className="px-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-black text-xs"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Bloco de Ações CSV */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={exportToCSV}
                        className="px-3 py-1.5 border-2 border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 active:shadow-none"
                    >
                        {t('dataPanel.exportTranslations')}
                    </button>

                    <label className="cursor-pointer px-3 py-1.5 border-2 border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:translate-y-0.5 active:shadow-none">
                        {t('dataPanel.importTranslations')}
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>
                </div>

                {/* Título da Tabela com Botão de Ajuda */}
                <div className="flex justify-between mb-2 items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <h4 className="font-black uppercase tracking-widest text-xs text-gray-900 dark:text-gray-100">
                            {t('dataPanel.translationTableTitle')}
                        </h4>
                        <button
                            type="button"
                            onClick={() => openHelp(
                                t('dataPanel.help.table.title'),
                                t('dataPanel.help.table.subtitle'),
                                <div className="space-y-2 text-sm">
                                    <p>{t('dataPanel.help.table.line1')}</p>
                                    <p><code>{t('dataPanel.help.table.syntaxExample')}</code></p>
                                </div>
                            )}
                            className={helpButtonClass}
                        >?</button>
                    </div>
                    <button
                        onClick={() => setIsPromptOpen(true)}
                        className="px-2 py-1 bg-yellow-400 text-gray-900 border-2 border-gray-900 font-black text-[10px] uppercase shadow-[2px_2px_0px_#000] transition-transform active:translate-y-0.5"
                    >
                        + {t('dataPanel.addKey')}
                    </button>
                </div>

                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse border border-gray-900 dark:border-gray-600">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                <th className="p-2 border border-gray-900 dark:border-gray-600 text-[10px] uppercase font-black">Key</th>
                                {translations.languages.map(lang => (
                                    <th key={lang} className="p-2 border border-gray-900 dark:border-gray-600 text-[10px] uppercase font-black">{lang.toUpperCase()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(translations.keys).map(([key, langs]) => (
                                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-2 border border-gray-900 dark:border-gray-600 font-mono text-[10px] font-bold text-gray-900 dark:text-gray-300">{key}</td>
                                    {translations.languages.map(lang => (
                                        <td key={lang} className="p-1 border border-gray-900 dark:border-gray-600">
                                            <button
                                                onClick={() => setEditData({ key, lang, value: langs[lang] })}
                                                className="w-full text-left p-1 text-[10px] truncate text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 font-medium"
                                            >
                                                {langs[lang] || <span className="italic opacity-40">Empty</span>}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <EditTranslationModal
                    isOpen={!!editData}
                    editData={editData}
                    sourceLang={sourceLang}
                    sourceValue={sourceValue}
                    onSave={(val) => handleEdit(editData.key, editData.lang, val)}
                    onClose={() => setEditData(null)}
                />

                <PromptModal
                    isOpen={isPromptOpen}
                    title={t('dataPanelPrompts.newKeyName')}
                    onConfirm={addNewKey}
                    onCancel={() => setIsPromptOpen(false)}
                />
            </div>
        </div>
    );
}