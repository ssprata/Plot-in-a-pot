// src/components/Inspector.jsx
import React, { useState, useEffect } from 'react';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';
import DeleteConfirmModal from './DeleteConfirmModal';
import VisualBlocksModal from './VisualBlocksModal';

const getImageUrl = (bgImage) => {
  if (!bgImage) return '';
  if (bgImage.startsWith('data:') || bgImage.startsWith('http://') || bgImage.startsWith('https://')) {
    return bgImage;
  }
  const publicUrl = process.env.PUBLIC_URL || '';
  return `${publicUrl}/presets/${bgImage}`;
};


export default function Inspector({
  selectedNode,
  nodes,
  updateSelectedNode,
  deleteNode,
  duplicateNode, // ADICIONADO
  syncChoicesFromText,
  setStartNode,
  onOpenVariables,
  onChangeVariables,
  translations, // ADICIONADO: Recebe a base mestre de tradução para ler as chaves no preview
  visualLogicEnabled = true,
  visualBlocksMode = false,
  globalVars = {},
  activeStep // ADICIONADO
}) {
  const { showInfoPopout } = useInfoPopout();
  const { t } = useTranslation();

  const [width, setWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = React.useRef(null);

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : 340;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const nextWidth = Math.max(280, Math.min(700, startWidth - deltaX));
      setWidth(nextWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, []);

  const [isLocalVarMode, setIsLocalVarMode] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlocksModalOpen, setIsBlocksModalOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('visual');
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const ghostScrollRef = React.useRef(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL || ''}/presets/manifest.json`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPresets(data);
        }
      })
      .catch(err => {
        console.warn('Could not load dynamic image presets:', err);
      });
  }, []);

  const isTutorialActive = !!activeStep;
  const isDeleteDisabled = isTutorialActive;
  const isLabelDisabled = isTutorialActive && (!activeStep.allowEditLabel || activeStep.targetNodeId !== selectedNode?.id);
  const isContentDisabled = isTutorialActive && (!activeStep.allowEditContent || activeStep.targetNodeId !== selectedNode?.id);
  const isCreateVarDisabled = isTutorialActive && (activeStep.highlightButton !== 'createVar' || selectedNode?.data.label !== 'StoryInit');

  // --- ESTADO LOCAL PARA O PREVIEW NARRATIVO ---
  const [previewLang, setPreviewLang] = useState(translations?.languages?.[0] || 'pt');

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  // --- LÓGICA DE VARIÁVEIS ---
  const extractVariables = (allNodes) => {
    const storyInit = allNodes.find(n => n.data.label === 'StoryInit');
    if (!storyInit || !storyInit.data.content) return [];
    const regex = /\$(\w+)/g;
    const matches = storyInit.data.content.match(regex) || [];
    return [...new Set(matches)];
  };

  const handleCreateVariable = () => {
    const name = prompt(t('inspector.prompts.globalVarName'));
    if (!name) return;
    const cleanName = name.startsWith('$') ? name : `$${name}`;
    const value = prompt(t('inspector.prompts.globalVarValue') + cleanName + ":", "0");
    if (value === null) return;

    const newMacro = `<<set ${cleanName} to ${value}>>\n`;
    const oldContent = selectedNode.data.content || "";
    updateSelectedNode({ content: newMacro + oldContent });
  };

  const handleChangeVariable = () => {
    const existingVars = extractVariables(nodes);

    let varName = prompt(
      isLocalVarMode
        ? t('inspector.prompts.localVarCreate')
        : t('inspector.prompts.localVarChange') + existingVars.join(', ')
    );

    if (!varName) return;
    if (!varName.startsWith('$')) varName = `$${varName}`;

    if (!isLocalVarMode && !existingVars.includes(varName)) {
      alert(t('inspector.prompts.varError'));
      return;
    }

    const newValue = prompt(t('inspector.prompts.newValue') + varName + ":");
    if (newValue === null) return;

    const newMacro = `\n<<set ${varName} to ${newValue}>>`;
    const oldContent = selectedNode.data.content || "";

    if (selectedNode.data.nodeType === 'choice') {
      syncChoicesFromText(selectedNode.id, oldContent + newMacro);
    } else {
      updateSelectedNode({ content: oldContent + newMacro });
    }
  };

  // --- COMPILADOR DE PREVIEW NARRATIVO LOCALIZADO ---
  const handleOpenTextPreview = () => {
    let rawContent = selectedNode.data.content || "";
    if (!rawContent) rawContent = "...";

    // 1. Algoritmo de substituição: Procura padrões t('sua.chave') ou t("sua.chave")
    const interpolatedText = rawContent.replace(/t\(['"]([^'"]+)['"]\)/g, (match, key) => {
      if (translations?.keys?.[key]?.[previewLang]) {
        return translations.keys[key][previewLang];
      }
      // Fallback em cascata: idioma base ou o nome da própria chave
      const defaultLang = translations?.languages?.[0] || 'pt';
      return translations?.keys?.[key]?.[defaultLang] || `[${key}]`;
    });

    // 2. Remove macros técnicas do SugarCube (como <<set>>) do texto puro de leitura da história
    const cleanNarrative = interpolatedText
      .replace(/<<set\s+.*?\s*to\s*.*?>>\n?/g, '')
      .replace(/<<set\s+.*?\s*=\s*.*?>>\n?/g, '')
      .trim();

    // 3. Injeta o resultado final estruturado diretamente no teu Popout lateral reaproveitável
    showInfoPopout({
      title: t('inspector.preview.title', 'Narrative Preview'),
      subtitle: `${t('inspector.preview.subtitle', 'Live simulation bundle')} [${previewLang.toUpperCase()}]`,
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-sans">
          <div className="bg-gray-100 dark:bg-gray-950 p-4 border-2 border-gray-900 dark:border-gray-700 shadow-inner whitespace-pre-wrap rounded-none min-h-[150px]">
            {cleanNarrative || <span className="italic opacity-40">Sem texto narrativo para simular nesta cena.</span>}
          </div>
          <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-tight">
            * Nota: Macros técnicas do tipo &lt;&lt;set&gt;&gt; e modificadores de memória foram omitidos desta visualização.
          </span>
        </div>
      )
    });
  };

  const handleAddChoice = () => {
    const choiceText = prompt(t('inspector.prompts.choiceText', 'Enter choice text:'));
    if (choiceText === null) return;
    const targetLabel = prompt(t('inspector.prompts.choiceTarget', 'Enter target passage title:'));
    if (!targetLabel) return;
    
    const newLink = `[[${choiceText}|${targetLabel}]]`;
    const oldContent = selectedNode.data.content || "";
    const newContent = oldContent + (oldContent && !oldContent.endsWith("\n") ? "\n" : "") + newLink;
    
    syncChoicesFromText(selectedNode.id, newContent);
  };

  const handleAddTag = () => {
    const newTag = prompt(t('inspector.prompts.newTag', 'Enter new tag:'));
    if (!newTag) return;
    const cleanTag = newTag.trim();
    const currentTags = selectedNode.data.tags || "";
    const tagArray = currentTags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.includes(cleanTag)) return;
    
    tagArray.push(cleanTag);
    updateSelectedNode({ tags: tagArray.join(', ') });
  };

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = selectedNode.data.tags || "";
    const tagArray = currentTags.split(',').map(t => t.trim()).filter(Boolean);
    const updatedArray = tagArray.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase());
    updateSelectedNode({ tags: updatedArray.join(', ') });
  };

  const helpButtonClass = "w-5 h-5 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-yellow-400 dark:hover:bg-yellow-400 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-[9px]";
  const isStoryInit = selectedNode?.data.label === 'StoryInit';

  const contentHelpBody = (
    <div className="space-y-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      <p className="font-medium italic">
        {t('inspector.help.content.help.subtitle')}
      </p>
      <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
        <h4 className="font-black uppercase text-xs text-blue-600 dark:text-blue-400 mb-1">
          {t('inspector.help.content.help.variablesTitle')}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {t('inspector.help.content.help.variablesText')}
        </p>
        <ul className="space-y-1 font-mono text-[11px] bg-gray-100 dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300">
          <li>{t('inspector.help.content.help.variablesExample1')}</li>
          <li>{t('inspector.help.content.help.variablesExample2')}</li>
          <li>{t('inspector.help.content.help.variablesExample3')}</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className={`relative border-r-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 flex flex-col h-full shadow-md shrink-0 ${
        isResizing ? '' : 'transition-[width] duration-150'
      }`}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 transition-colors duration-150 ${
          isResizing ? 'bg-yellow-400 dark:bg-yellow-500' : 'hover:bg-yellow-400/80 dark:hover:bg-yellow-500/80'
        }`}
      />

      <div className="flex-1 overflow-y-auto p-3 flex flex-col">
        <h3 className="mt-0 border-b-2 border-gray-900 dark:border-gray-700 pb-3 mb-4 text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center">
          <span className="inline-block w-2.5 h-2.5 bg-yellow-400 mr-2 border border-gray-900 dark:border-gray-205 shadow-[1px_1px_0px_#000]"></span>
          {t('inspector.title', 'CELL INSPECTOR').toUpperCase()}
        </h3>

        {selectedNode ? (
          <div className="flex-1 flex flex-col">
          {selectedNode.type === 'zone' || selectedNode.data.nodeType === 'zone' ? (
            <div className="flex-1 flex flex-col">
              {/* NODE ID */}
              <div className="mb-4">
                <label className="block font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {t('inspector.nodeIdLabel', 'NODE ID')}
                </label>
                <input
                  className="w-full p-2.5 border-2 border-gray-900 dark:border-gray-750 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-mono text-sm font-bold border-l-4 border-l-yellow-400 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] focus:outline-none focus:border-gray-900"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                />
              </div>

              {/* COLOR FIELD */}
              <div className="mb-4">
                <label className="block font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  COR DA ZONA
                </label>
                <div className="flex flex-wrap gap-2">
                  {['#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateSelectedNode({ color: c })}
                      className="w-8 h-8 border-2 border-gray-900 dark:border-gray-750 cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
                      style={{ backgroundColor: c, borderStyle: selectedNode.data.color === c || (!selectedNode.data.color && c === '#f59e0b') ? 'double' : 'solid', borderWidth: selectedNode.data.color === c || (!selectedNode.data.color && c === '#f59e0b') ? '4px' : '2px' }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-950 p-3 border-2 border-gray-900 dark:border-gray-700 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                <strong>Info:</strong> Arraste outras passagens para dentro desta zona para as agrupar. Ao mover a zona, as passagens agrupadas mover-se-ão com ela.
              </div>
            </div>
          ) : (
            <>
              {/* ADVANCED TYPE & START ROW */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1">
                  <label className="block font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {t('inspector.type')}
                  </label>
                  <select
                    className="w-full p-2 border-2 border-gray-900 dark:border-gray-750 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs font-bold rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] focus:outline-none cursor-pointer"
                    value={selectedNode.data.nodeType || 'choice'}
                    onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
                  >
                    <option value="choice">{t('inspector.typeChoice')}</option>
                    <option value="javascript">{t('inspector.typeJavaScript')}</option>
                    <option value="css">{t('inspector.typeCss')}</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setStartNode(selectedNode.id)}
                    className="w-full p-2 border-2 border-gray-900 dark:border-gray-750 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-805 text-blue-900 dark:text-blue-100 font-black text-[9px] uppercase tracking-wider shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    {t('inspector.setStart', 'SET START')}
                  </button>
                </div>
              </div>

              {/* NODE ID */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('inspector.nodeIdLabel', 'NODE ID')}
                  </label>
                  <button type="button" onClick={() => openHelp(t('inspector.help.label.title'), t('inspector.help.label.subtitle'), <p>{t('inspector.help.label.text')}</p>)} className={helpButtonClass}>?</button>
                </div>
                <input
                  disabled={isLabelDisabled}
                  className={`w-full p-2.5 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-mono text-sm font-bold border-l-4 border-l-yellow-400 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] focus:outline-none focus:border-gray-900 ${isLabelDisabled ? 'opacity-55 cursor-not-allowed' : ''}`}
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                />
              </div>

              {/* PASSAGE TEXT / SOURCE CODE */}
              <div className="mb-4 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {selectedNode.data.nodeType === 'choice' ? t('inspector.narrativeText', 'PASSAGE TEXT').toUpperCase() : t('inspector.sourceCode', 'SOURCE CODE').toUpperCase()}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isStoryInit ? (
                      <button
                        type="button"
                        onClick={onOpenVariables ?? handleCreateVariable}
                        disabled={isCreateVarDisabled}
                        className={`px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase border border-black shadow-[1px_1px_0px_#000] active:translate-y-0.5 active:shadow-none ${isCreateVarDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        {t('inspector.createVariable')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onChangeVariables ?? handleChangeVariable}
                        disabled={isCreateVarDisabled}
                        className={`px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase border border-black shadow-[1px_1px_0px_#000] active:translate-y-0.5 active:shadow-none ${isCreateVarDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        {t('inspector.changeValue')}
                      </button>
                    )}
                    <button type="button" onClick={() => openHelp(t('inspector.help.content.title'), t('inspector.help.content.subtitle'), contentHelpBody)} className={helpButtonClass}>?</button>
                  </div>
                </div>

                <div className="flex flex-col relative">
                  {selectedNode.data.nodeType === 'choice' && visualLogicEnabled && (
                    <div className="flex gap-1 mb-2">
                      <button
                        type="button"
                        onClick={() => setInspectorTab('visual')}
                        className={`flex-1 py-1 text-[9px] uppercase font-bold border transition-all ${
                          inspectorTab === 'visual'
                            ? 'bg-yellow-400 border-gray-900 dark:border-gray-200 text-black shadow-none font-black'
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Visual ⚡
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectorTab('code')}
                        className={`flex-1 py-1 text-[9px] uppercase font-bold border transition-all ${
                          inspectorTab === 'code'
                            ? 'bg-yellow-400 border-gray-900 dark:border-gray-200 text-black shadow-none font-black'
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Código
                      </button>
                    </div>
                  )}

                  {selectedNode.data.nodeType === 'choice' && visualLogicEnabled && inspectorTab === 'visual' ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="bg-gray-100 dark:bg-gray-950 border-2 border-gray-900 dark:border-gray-700 p-2.5 text-xs text-gray-750 dark:text-gray-300 max-h-[100px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono">
                        {(selectedNode.data.content || '').slice(0, 150) || <span className="italic opacity-55">Sem conteúdo…</span>}
                        {(selectedNode.data.content || '').length > 150 && <span className="opacity-40">…</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBlocksModalOpen(true)}
                        className="w-full py-2 border-2 border-gray-900 dark:border-gray-200 bg-yellow-400 hover:bg-yellow-350 text-gray-950 font-black uppercase text-xs shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ⚡ {t('visualBlocks.modalTitle', 'Lógica Visual')}
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const hasGhostText = activeStep && activeStep.targetNodeId === selectedNode.id && activeStep.ghostText;
                      const isChoice = selectedNode.data.nodeType === 'choice';
                      const wrapperBg = isChoice ? 'bg-white dark:bg-gray-950' : 'bg-gray-950';
                      const textareaFontClass = isChoice ? 'font-sans text-sm text-gray-900 dark:text-white' : 'font-mono text-xs text-emerald-400';
                      const textareaBgClass = hasGhostText ? 'bg-transparent' : wrapperBg;

                      const textareaElement = (
                        <textarea
                          disabled={isContentDisabled}
                          className={`w-full flex-1 p-2.5 border-2 border-gray-900 dark:border-gray-700 text-gray-900 dark:text-white rounded-none outline-none focus:outline-none transition-all resize-y min-h-[140px] ${textareaFontClass} ${textareaBgClass} ${isContentDisabled ? 'opacity-55 cursor-not-allowed' : ''}`}
                          value={selectedNode.data.content || ''}
                          onChange={(e) => {
                            if (isChoice) {
                              syncChoicesFromText(selectedNode.id, e.target.value);
                            } else {
                              updateSelectedNode({ content: e.target.value });
                            }
                          }}
                        />
                      );

                      if (hasGhostText) {
                        return (
                          <div className={`relative w-full flex-1 flex flex-col min-h-[140px] border-2 border-gray-900 dark:border-gray-700 ${wrapperBg} overflow-hidden`}>
                            <textarea
                              disabled
                              ref={ghostScrollRef}
                              className={`absolute inset-0 pointer-events-none p-2 border-0 bg-transparent text-gray-400 dark:text-gray-500 opacity-55 resize-none overflow-hidden select-none z-0 ${textareaFontClass}`}
                              value={activeStep.ghostText}
                            />
                            <textarea
                              disabled={isContentDisabled}
                              className={`w-full flex-1 h-full p-2 bg-transparent border-0 text-gray-900 dark:text-white rounded-none outline-none focus:outline-none resize-none z-10 ${textareaFontClass} ${isContentDisabled ? 'opacity-55 cursor-not-allowed' : ''}`}
                              value={selectedNode.data.content || ''}
                              onChange={(e) => {
                                if (isChoice) {
                                  syncChoicesFromText(selectedNode.id, e.target.value);
                                } else {
                                  updateSelectedNode({ content: e.target.value });
                                }
                              }}
                              onScroll={(e) => {
                                if (ghostScrollRef.current) {
                                  ghostScrollRef.current.scrollTop = e.target.scrollTop;
                                }
                              }}
                            />
                          </div>
                        );
                      }

                      return textareaElement;
                    })()
                  )}
                </div>

                {/* SYNTAX WARNINGS */}
                {selectedNode.data.warnings && selectedNode.data.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-orange-900/50 dark:bg-orange-950 border-2 border-orange-500">
                    <span className="block mb-1 font-black uppercase text-[9px] text-orange-400 tracking-widest">{t('inspector.syntaxWarnings')}</span>
                    <ul className="space-y-1 text-orange-100 font-mono text-[10px]">
                      {selectedNode.data.warnings.map((w, i) => (
                        <li key={i} className="flex items-start">
                          <span className="font-bold text-orange-500 mr-1.5">[!]</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* LOCAL VARIABLE MODE HINT */}
              {!isStoryInit && (
                <div className="mb-4 flex items-center justify-end gap-2">
                  <input
                    type="checkbox"
                    id="localVar"
                    checked={isLocalVarMode}
                    onChange={(e) => setIsLocalVarMode(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="localVar" className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase cursor-pointer">
                    {t('inspector.localVarHint')}
                  </label>
                </div>
              )}



              {/* TAGS */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('inspector.tagsLabel', 'TAGS')}
                  </label>
                  <button type="button" onClick={() => openHelp(t('inspector.help.tags.title'), t('inspector.help.tags.subtitle'), <p>{t('inspector.help.tags.text')}</p>)} className={helpButtonClass}>?</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const tagsString = selectedNode.data.tags || '';
                    const tags = tagsString
                      .split(',')
                      .map(t => t.trim())
                      .filter(t => t !== '');
                    
                    return (
                      <>
                        {tags.map(tag => (
                          <span
                            key={tag}
                            onClick={() => handleRemoveTag(tag)}
                            title="Clique para remover"
                            className="px-2 py-1 bg-yellow-400 text-gray-950 border-2 border-gray-900 text-[10px] font-black uppercase shadow-[1px_1px_0px_#000] hover:bg-red-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {tag}
                            <span className="text-[8px] opacity-75">✕</span>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-2 py-1 border-2 border-dashed border-gray-400 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-950 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase transition-colors cursor-pointer"
                        >
                          + {t('inspector.addTag', 'TAG')}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* POSITION */}
              <div className="mb-4">
                <label className="block font-black text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {t('inspector.positionLabel', 'POSITION')}
                </label>
                <div className="border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 p-2 font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]">
                  X {Math.round(selectedNode.position?.x || 0)} Y {Math.round(selectedNode.position?.y || 0)}
                </div>
              </div>

              {/* IMAGE SECTION */}
              <div className="mb-4 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]">
                <button
                  type="button"
                  onClick={() => setIsImageSectionOpen(!isImageSectionOpen)}
                  className="w-full p-2 flex items-center justify-between font-black text-[10px] uppercase text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <span>🖼️ {t('inspector.imageSection', 'Imagem de Fundo')}</span>
                  <span className="font-mono">{isImageSectionOpen ? '▲' : '▼'}</span>
                </button>
                {isImageSectionOpen && (
                  <div className="p-3 border-t-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 space-y-3">
                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        {t('inspector.imagePresets', 'Imagens Predefinidas')}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateSelectedNode({ bgImage: '' })}
                          className={`px-2 py-1 text-[10px] font-bold border-2 border-gray-900 dark:border-gray-750 text-left transition-colors cursor-pointer ${
                            !selectedNode.data.bgImage
                              ? 'bg-blue-600 text-white dark:bg-blue-500 border-gray-900'
                              : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {t('inspector.imageNone', 'Nenhuma')}
                        </button>
                        {presets.map((filename) => {
                          const isActive = selectedNode.data.bgImage === filename;
                          const displayName = filename.split('.')[0];
                          const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                          return (
                            <button
                              key={filename}
                              type="button"
                              onClick={() => updateSelectedNode({ bgImage: filename })}
                              className={`px-2 py-1 text-[10px] font-bold border-2 border-gray-900 dark:border-gray-750 text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-blue-600 text-white dark:bg-blue-500 border-gray-900'
                                  : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              {capitalizedName}
                            </button>
                          );
                        })}
                      </div>
                      {presets.length === 0 && (
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 italic mt-1.5">
                          Coloca imagens em <code className="bg-gray-150 dark:bg-gray-900 px-1 py-0.5 font-mono">public/presets/</code> para veres opções.
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        {t('inspector.imageUrlLabel', 'Ou URL personalizada')}
                      </label>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={(!selectedNode.data.bgImage?.startsWith('data:') && !presets.includes(selectedNode.data.bgImage)) ? selectedNode.data.bgImage || '' : ''}
                        onChange={(e) => updateSelectedNode({ bgImage: e.target.value })}
                        className="w-full p-1.5 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-none text-xs font-mono shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]"
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        {t('inspector.imageUploadLabel', 'Ou carregar ficheiro')}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateSelectedNode({ bgImage: reader.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-gray-500 dark:text-gray-400 file:mr-2 file:py-0.5 file:px-2 file:border-2 file:border-gray-900 file:bg-gray-100 dark:file:bg-gray-900 dark:file:text-white dark:file:border-gray-750 text-clip overflow-hidden cursor-pointer"
                      />
                      {selectedNode.data.bgImage && (
                        <div className="relative w-full h-16 border-2 border-gray-900 dark:border-gray-700 overflow-hidden bg-cover bg-center mt-1.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]" style={{ backgroundImage: `url(${getImageUrl(selectedNode.data.bgImage)})` }} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MOTOR PREVIEW LOCALIZADO */}
              {selectedNode.data.nodeType === 'choice' && (
                <div className="mb-4 p-2.5 bg-gray-50 dark:bg-gray-950 border-2 border-gray-900 dark:border-gray-700 flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                    {t('inspector.preview.engine', 'Motor de Preview Localizado')}
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={previewLang}
                      onChange={(e) => setPreviewLang(e.target.value)}
                      className="flex-1 p-1 bg-white dark:bg-gray-950 border-2 border-gray-900 dark:border-gray-700 text-xs font-bold uppercase text-gray-900 dark:text-white rounded-none outline-none focus:outline-none"
                    >
                      {translations?.languages?.map((lang) => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleOpenTextPreview}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-350 border-2 border-gray-900 text-gray-900 font-black text-xs uppercase tracking-wider shadow-[1px_1px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      {t('inspector.previewButton', 'Preview')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* DELETE & DUPLICATE BUTTONS */}
          <div className="mt-auto pt-4 border-t-2 border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleteDisabled}
              className={
                "flex-1 p-2.5 font-black text-xs uppercase tracking-wider transition-all " +
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
                "border-2 border-gray-900 bg-orange-600 text-white shadow-[2px_2px_0px_#000] " +
                "hover:bg-orange-700 " +
                "dark:bg-orange-600 dark:border-gray-200 dark:text-white dark:shadow-[2px_2px_0px_#fff] " +
                "dark:hover:bg-orange-700 cursor-pointer " +
                (isDeleteDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "")
              }
            >
              {t('inspector.deleteNode')}
            </button>
            <button
              type="button"
              onClick={() => duplicateNode(selectedNode.id)}
              className={
                "flex-1 p-2.5 font-black text-xs uppercase tracking-wider transition-all " +
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
                "border-2 border-gray-900 bg-transparent text-gray-900 shadow-[2px_2px_0px_#000] " +
                "hover:bg-gray-900 hover:text-white " +
                "dark:bg-transparent dark:border-gray-200 dark:text-gray-100 dark:shadow-[2px_2px_0px_#fff] " +
                "dark:hover:bg-gray-100 dark:hover:text-gray-900 cursor-pointer"
              }
            >
              {t('inspector.duplicate', 'DUPLICATE')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center italic text-gray-400 text-sm text-center px-4">
          {t('inspector.selectNode')}
        </div>
      )}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteNode(selectedNode.id)}
        message={t('inspector.deleteConfirm.nodeMessage', 'Tens a certeza que desejas eliminar este nó de cena? Todas as ligações ligadas a ele serão removidas em cascata do grafo.')}
      />

      <VisualBlocksModal
        isOpen={isBlocksModalOpen}
        onClose={() => setIsBlocksModalOpen(false)}
        selectedNode={selectedNode}
        nodes={nodes}
        globalVars={globalVars}
        updateSelectedNode={updateSelectedNode}
        syncChoicesFromText={syncChoicesFromText}
      />
    </div>
  );
}