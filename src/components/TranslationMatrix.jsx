import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function TranslationMatrix({ isOpen, onClose, translations, setTranslations }) {
    const { t } = useTranslation();
    const { showInfoPopout } = useInfoPopout();

    // --- ESTADOS LOCAIS ---
    const [selectedCell, setSelectedCell] = useState(null); // { key, lang }
    const [editValue, setEditValue] = useState('');
    const [newLang, setNewLang] = useState('');

    const sourceLang = translations?.languages?.[0] || 'pt';

    useEffect(() => {
        if (selectedCell) {
            const value = translations.keys[selectedCell.key]?.[selectedCell.lang] || '';
            setEditValue(value);
        } else {
            setEditValue('');
        }
    }, [selectedCell, translations]);

    if (!isOpen) return null;

    // --- AUXILIARES DE INTERFACE ---
    const openHelp = (title, subtitle, content) => {
        showInfoPopout({ title, subtitle, content });
    };

    const helpButtonClass = "w-5 h-5 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] text-[10px]";

    // --- OPERAÇÕES DA BASE DE DADOS ---
    const saveCurrentTranslation = () => {
        if (!selectedCell) return;
        setTranslations(prev => ({
            ...prev,
            keys: {
                ...prev.keys,
                [selectedCell.key]: {
                    ...prev.keys[selectedCell.key],
                    [selectedCell.lang]: editValue
                }
            }
        }));
    };

    const toggleLanguage = (lang) => {
        setTranslations(prev => {
            if (prev.languages.includes(lang)) {
                const newLanguages = prev.languages.filter(l => l !== lang);
                const newKeys = { ...prev.keys };
                Object.keys(newKeys).forEach(k => delete newKeys[k][lang]);
                if (selectedCell?.lang === lang) setSelectedCell(null);
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
        a.href = url; a.download = 'localization_database.csv'; a.click();
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
            setSelectedCell(null);
            setTranslations({ languages, keys: newKeys });
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const referenceValue = selectedCell ? translations.keys[selectedCell.key]?.[sourceLang] : '';

    return (
        <div className="fixed inset-0 z-[180] flex bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            
            {/* PAINEL DA ESQUERDA (70%): GESTÃO E TABELA MATRIX */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden border-r-4 border-gray-900 dark:border-gray-700">
                
                {/* Cabeçalho Superior de Ações */}
                <div className="flex justify-between items-center border-b-4 border-gray-900 dark:border-gray-600 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="font-black text-xl uppercase tracking-widest bg-yellow-400 text-gray-900 px-2 py-1 border-2 border-gray-900 shadow-[2px_2px_0px_#000]">
                                {t('translationMatrix.title', 'Localization Matrix')}
                            </h2>
                            <button
                                type="button"
                                onClick={() => openHelp(
                                    t('translationMatrix.help.title', 'Matrix Workspace Help'),
                                    t('translationMatrix.help.subtitle', 'Multi-language management configuration'),
                                    <div className="space-y-2 text-sm">
                                        <p>{t('translationMatrix.help.line1', 'Select any table cell to translate its content directly in the inspector panel.')}</p>
                                        <p>{t('translationMatrix.help.line2', 'The first configured column functions as the source language of reference for the simulation.')}</p>
                                    </div>
                                )}
                                className={helpButtonClass}
                            >?</button>
                        </div>
                        
                        {/* Gestão de Locales */}
                        <div className="flex items-center gap-2 border-2 border-gray-900 dark:border-gray-600 bg-white dark:bg-gray-800 p-1.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                            {translations.languages.map(lang => (
                                <button 
                                    key={lang} 
                                    onClick={() => toggleLanguage(lang)}
                                    className="px-1.5 py-0.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-black text-[9px] uppercase border border-transparent hover:border-red-500 cursor-pointer"
                                    title={t('translationMatrix.removeLanguageHint', 'Click to remove this language')}
                                >
                                    {lang.toUpperCase()} ×
                                </button>
                            ))}
                            <div className="flex items-center border-l-2 border-gray-300 dark:border-gray-600 pl-2 gap-1">
                                <input 
                                    className="w-10 bg-transparent text-[10px] font-bold uppercase outline-none text-gray-900 dark:text-gray-100" 
                                    placeholder={t('translationMatrix.addPlaceholder', 'ADD')} 
                                    maxLength={3}
                                    value={newLang}
                                    onChange={e => setNewLang(e.target.value.toUpperCase())}
                                />
                                <button 
                                    onClick={() => {
                                        if (newLang && !translations.languages.includes(newLang.toLowerCase())) {
                                            toggleLanguage(newLang.toLowerCase());
                                            setNewLang('');
                                        }
                                    }}
                                    className="font-black text-xs px-1 text-green-600 hover:text-green-500 cursor-pointer"
                                >+</button>
                            </div>
                        </div>
                    </div>

                    {/* Botões CSV */}
                    <div className="flex gap-2">
                        <button onClick={exportToCSV} className="px-3 py-1.5 border-2 border-gray-900 bg-white text-gray-900 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer">
                            {t('translationMatrix.exportCsv', 'Export CSV')}
                        </button>
                        <label className="cursor-pointer px-3 py-1.5 border-2 border-gray-900 bg-black text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none">
                            {t('translationMatrix.importCsv', 'Import CSV')}
                            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                        </label>
                        <button onClick={onClose} className="px-3 py-1.5 border-2 border-gray-900 bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none ml-4 cursor-pointer">
                            {t('common.close', 'Close')}
                        </button>
                    </div>
                </div>

                {/* Grade da Tabela Expandida */}
                <div className="flex-1 overflow-auto border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-900 text-white sticky top-0 z-10">
                                {/* CORREGIDO: Reduzido a largura da coluna de chaves para poupar espaço real */}
                                <th className="p-3 border-b border-r border-gray-700 text-xs uppercase font-black w-[130px] bg-gray-900">{t('translationMatrix.columnKey', 'Key')}</th>
                                {translations.languages.map(lang => (
                                    /* CORREGIDO: Reduzido drasticamente as restrições de largura (min-w-0 e sem max-w artificial) */
                                    /* para que as colunas caibam todas confortavelmente lado a lado no ecrã principal */
                                    <th key={lang} className="p-3 border-b border-r border-gray-700 text-xs uppercase font-black min-w-[150px] bg-gray-900">
                                        {lang.toUpperCase()} {lang === sourceLang && <span className="text-[9px] text-yellow-400 font-normal">({t('translationMatrix.sourceBadge', 'Source')})</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(translations.keys).map(([key, langs]) => (
                                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 font-mono text-xs">
                                    <td className="p-3 border-r border-gray-200 dark:border-gray-700 font-bold bg-gray-50 dark:bg-gray-900/50 select-all text-gray-900 dark:text-gray-300 truncate" title={key}>{key}</td>
                                    {translations.languages.map(lang => {
                                        const isSelected = selectedCell?.key === key && selectedCell?.lang === lang;
                                        return (
                                            <td 
                                                key={lang} 
                                                onClick={() => setSelectedCell({ key, lang })}
                                                className={`p-2 border-r border-gray-200 dark:border-gray-700 align-top cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/40 ring-2 ring-inset ring-yellow-500' 
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                }`}
                                            >
                                                {/* CORREGIDO: O line-clamp-2 garante que vês as primeiras duas linhas de texto resumidas sem quebrar o tamanho da linha */}
                                                <div className="line-clamp-2 break-words text-gray-800 dark:text-gray-200 leading-relaxed text-[11px]">
                                                    {langs[lang] || <span className="italic opacity-30 text-[10px] text-gray-400">{t('translationMatrix.emptyCell', 'Empty cell')}</span>}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAINEL DA DIREITA (30%): INSPETOR INTEGRADO SEM MODAIS */}
            <div className="w-96 bg-gray-50 dark:bg-gray-950 p-6 flex flex-col overflow-y-auto border-l border-gray-200 dark:border-gray-800">
                <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-gray-900 dark:border-gray-700 pb-2 mb-4 text-gray-500">
                    {t('translationMatrix.inspectorTitle', 'Cell Inspector')}
                </h3>

                {selectedCell ? (
                  <div className="flex-1 flex flex-col space-y-4">
                      <div>
                          <span className="block text-[10px] font-black text-gray-400 uppercase">{t('translationMatrix.selectedKey', 'Selected Key')}</span>
                          <div className="font-mono text-xs font-bold bg-white dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 select-all text-gray-900 dark:text-gray-100">
                              {selectedCell.key}
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase">{t('translationMatrix.targetLocale', 'Target Locale:')}</span>
                          <span className="px-2 py-0.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-mono font-black text-xs uppercase rounded">
                              {selectedCell.lang}
                          </span>
                      </div>

                      {/* Bloco de Referência */}
                      {selectedCell.lang !== sourceLang && (
                          <div className="p-3 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded">
                              <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">
                                  {t('translationMatrix.referenceTextLabel', 'Reference Text')} ({sourceLang.toUpperCase()}):
                              </span>
                              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto leading-relaxed">
                                  {referenceValue || <span className="italic opacity-40 text-gray-500">{t('translationMatrix.noReference', 'No reference text found in source locale.')}</span>}
                              </p>
                          </div>
                      )}

                      {/* Campo de Tradução Direta */}
                      <div className="flex-1 flex flex-col min-h-[200px]">
                          <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t('translationMatrix.inputLabel', 'Translation Input')}</span>
                          <textarea
                              className="flex-1 w-full p-3 border-2 border-gray-900 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono text-xs text-gray-900 dark:text-gray-100 outline-none shadow-inner resize-none leading-relaxed focus:border-yellow-500"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder={selectedCell.lang !== sourceLang && referenceValue ? referenceValue : t('translationMatrix.inputPlaceholder', 'Write your translation here...')}
                          />
                      </div>

                      {/* Ações do Inspetor */}
                      <div className="pt-2">
                          <button 
                              onClick={saveCurrentTranslation}
                              className="w-full py-2 border-2 border-gray-900 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                          >
                              {t('translationMatrix.applyChanges', 'Apply Changes')}
                          </button>
                      </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600 italic text-xs font-mono p-4 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded">
                      {t('translationMatrix.emptySelectionHint', 'Select any table cell to inspect or edit its content without popups.')}
                  </div>
                )}
            </div>
        </div>
    );
}