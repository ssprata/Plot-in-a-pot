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

  const [isLocalVarMode, setIsLocalVarMode] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlocksModalOpen, setIsBlocksModalOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('visual');
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false);
  const [presets, setPresets] = useState([]);

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

  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer text-xs";
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
    <div className="w-[340px] p-3 border-r-2 border-gray-300 dark:border-gray-600 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col h-full shadow-md">
      <h3 className="mt-0 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4 text-lg font-bold text-gray-800 dark:text-gray-200">
        {t('inspector.title')}
      </h3>

      {selectedNode ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic">
            <strong>ID:</strong> {selectedNode.id}
          </div>

          {selectedNode.type === 'zone' || selectedNode.data.nodeType === 'zone' ? (
            <div className="flex-1 flex flex-col">
              {/* LABEL FIELD */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t('inspector.label')}</label>
                </div>
                <input
                  className="w-full p-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white rounded bg-gray-50 dark:bg-gray-700"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                />
              </div>

              {/* COLOR FIELD */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">Cor da Zona</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateSelectedNode({ color: c })}
                      className="w-8 h-8 border-2 border-gray-900 cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
                      style={{ backgroundColor: c, borderStyle: selectedNode.data.color === c || (!selectedNode.data.color && c === '#f59e0b') ? 'double' : 'solid', borderWidth: '4px' }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-3 border-2 border-gray-900 dark:border-gray-700 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                <strong>Info:</strong> Arraste outras passagens para dentro desta zona para as agrupar. Ao mover a zona, as passagens agrupadas mover-se-ão com ela.
              </div>
            </div>
          ) : (
            <>
              {/* IMAGE SECTION */}
              <div className="mb-4 border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                <button
                  type="button"
                  onClick={() => setIsImageSectionOpen(!isImageSectionOpen)}
                  className="w-full p-2 flex items-center justify-between font-black text-xs uppercase text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <span>🖼️ {t('inspector.imageSection', 'Imagem de Fundo')}</span>
                  <span className="font-mono">{isImageSectionOpen ? '▲' : '▼'}</span>
                </button>
                    {isImageSectionOpen && (
                  <div className="p-3 border-t-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                    {/* Preset list/grid of buttons */}
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                        {t('inspector.imagePresets', 'Imagens Predefinidas')}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateSelectedNode({ bgImage: '' })}
                          className={`px-2 py-1 text-[10px] font-bold border-2 border-gray-900 dark:border-gray-600 text-left transition-colors cursor-pointer ${
                            !selectedNode.data.bgImage
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
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
                              className={`px-2 py-1 text-[10px] font-bold border-2 border-gray-900 dark:border-gray-600 text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              {capitalizedName}
                            </button>
                          );
                        })}
                      </div>
                      {presets.length === 0 && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-1.5">
                          Coloca imagens em <code className="bg-gray-100 dark:bg-gray-950 px-1 py-0.5 font-mono">public/presets/</code> para veres opções predefinidas aqui.
                        </div>
                      )}
                    </div>

                    {/* URL section */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                        {t('inspector.imageUrlLabel', 'Ou URL personalizada')}
                      </label>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={(!selectedNode.data.bgImage?.startsWith('data:') && !presets.includes(selectedNode.data.bgImage)) ? selectedNode.data.bgImage || '' : ''}
                        onChange={(e) => updateSelectedNode({ bgImage: e.target.value })}
                        className="w-full p-1.5 border-2 border-gray-900 dark:border-gray-600 text-gray-900 dark:text-white rounded-none bg-gray-50 dark:bg-gray-700 text-xs font-mono"
                      />
                    </div>

                    {/* File upload section */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
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
                        className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-2 file:border-2 file:border-gray-900 file:bg-gray-100 dark:file:bg-gray-700 dark:file:text-white dark:file:border-gray-500 text-clip overflow-hidden cursor-pointer"
                      />
                      {selectedNode.data.bgImage && (
                        <div className="relative w-full h-16 border-2 border-gray-900 dark:border-gray-600 overflow-hidden bg-cover bg-center mt-1.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]" style={{ backgroundImage: `url(${getImageUrl(selectedNode.data.bgImage)})` }} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* LABEL FIELD */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t('inspector.label')}</label>
                  <button type="button" onClick={() => openHelp(t('inspector.help.label.title'), t('inspector.help.label.subtitle'), <p>{t('inspector.help.label.text')}</p>)} className={helpButtonClass}>?</button>
                </div>
                <input
                  disabled={isLabelDisabled}
                  className={`w-full p-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white rounded bg-gray-50 dark:bg-gray-700 ${isLabelDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    } ${activeStep?.highlightButton === 'editLabel' ? 'tutorial-btn-flash' : ''}`}
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                />
              </div>

              {/* TYPE FIELD */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t('inspector.type')}</label>
                  <button type="button" onClick={() => openHelp(t('inspector.help.type.title'), t('inspector.help.type.subtitle'), <p>{t('inspector.help.type.text')}</p>)} className={helpButtonClass}>?</button>
                </div>
                <select
                  className="w-full p-2 border border-gray-400 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={selectedNode.data.nodeType || 'choice'}
                  onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
                >
                  <option value="choice">{t('inspector.typeChoice')}</option>
                  <option value="javascript">{t('inspector.typeJavaScript')}</option>
                  <option value="css">{t('inspector.typeCss')}</option>
                </select>
              </div>

              {/* TAGS FIELD */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t('inspector.tags')}</label>
                  <button type="button" onClick={() => openHelp(t('inspector.help.tags.title'), t('inspector.help.tags.subtitle'), <p>{t('inspector.help.tags.text')}</p>)} className={helpButtonClass}>?</button>
                </div>
                <input
                  className="w-full p-2 border border-gray-400 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-xs"
                  placeholder="ex: secreto, start"
                  value={selectedNode.data.tags || ''}
                  onChange={(e) => updateSelectedNode({ tags: e.target.value })}
                />
              </div>

              {/* START BUTTON */}
              <div className="mb-4">
                <button
                  onClick={() => setStartNode(selectedNode.id)}
                  className="w-full p-2 border-2 border-gray-800 dark:border-gray-200 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 text-blue-900 dark:text-blue-100 font-bold text-xs uppercase shadow-[2px_2px_0px_#000]"
                >
                  {t('inspector.setStart')}
                </button>
              </div>

              {/* NARRATIVE TEXT LIVE PREVIEW PANEL (ADICIONADO) */}
              {selectedNode.data.nodeType === 'choice' && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-700 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Motor de Preview Localizado
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={previewLang}
                      onChange={(e) => setPreviewLang(e.target.value)}
                      className="flex-1 p-1 bg-white dark:bg-gray-800 border-2 border-gray-900 text-xs font-bold uppercase text-gray-900 dark:text-white"
                    >
                      {translations?.languages?.map((lang) => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleOpenTextPreview}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 border-2 border-gray-900 text-gray-900 font-black text-xs uppercase tracking-tight shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                    >
                      {t('inspector.previewButton', 'Preview')}
                    </button>
                  </div>
                </div>
              )}

              {/* CONTENT AREA */}
              <div className="mb-4 flex-1 flex flex-col">
                <div className="flex flex-col mb-2 gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        {selectedNode.data.nodeType === 'choice' ? t('inspector.narrativeText') : t('inspector.sourceCode')}
                      </label>

                      <button
                        type="button"
                        onClick={() => openHelp(t('inspector.help.content.title'), t('inspector.help.content.subtitle'), contentHelpBody)}
                        className={helpButtonClass}
                      >
                        ?
                      </button>
                    </div>

                    {isStoryInit ? (
                      <button
                        onClick={onOpenVariables ?? handleCreateVariable}
                        disabled={isCreateVarDisabled}
                        className={`px-2 py-1 bg-blue-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] ${isCreateVarDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                          } ${activeStep?.highlightButton === 'createVar' ? 'tutorial-btn-flash' : ''}`}
                      >
                        {t('inspector.createVariable')}
                      </button>
                    ) : (
                      <button
                        onClick={onChangeVariables ?? handleChangeVariable}
                        disabled={isCreateVarDisabled}
                        className={`px-2 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] ${isCreateVarDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                          } ${activeStep?.highlightButton === 'changeVar' ? 'tutorial-btn-flash' : ''}`}
                      >
                        {t('inspector.changeValue')}
                      </button>
                    )}
                  </div>

                  {!isStoryInit && (
                    <div className="flex items-center gap-2 self-end">
                      <input
                        type="checkbox"
                        id="localVar"
                        checked={isLocalVarMode}
                        onChange={(e) => setIsLocalVarMode(e.target.checked)}
                        className="w-3 h-3 accent-emerald-600 cursor-pointer"
                      />
                      <label htmlFor="localVar" className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer">
                        {t('inspector.localVarHint')}
                      </label>
                    </div>
                  )}
                </div>

                {selectedNode.data.nodeType === 'choice' && visualLogicEnabled && (
                  <div className="flex gap-1.5 mb-3 select-none border-b-2 border-gray-900 dark:border-gray-200 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('visual')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 text-center transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none ${inspectorTab === 'visual'
                          ? 'bg-yellow-400 border-gray-900 text-black shadow-none translate-y-0.5 font-black'
                          : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-900 dark:border-gray-400 hover:bg-gray-100'
                        }`}
                    >
                      Visual ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('code')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 text-center transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none ${inspectorTab === 'code'
                          ? 'bg-yellow-400 border-gray-900 text-black shadow-none translate-y-0.5 font-black'
                          : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-900 dark:border-gray-400 hover:bg-gray-100'
                        }`}
                    >
                      Código / Texto
                    </button>
                  </div>
                )}

                {selectedNode.data.nodeType === 'choice' && visualLogicEnabled && inspectorTab === 'visual' ? (
                  <div className="flex flex-col gap-3">
                    {/* Summary preview: show narrative snippet */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>📝</span> {t('inspector.preview.title', 'Narrative Preview')}
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-900 dark:border-gray-600 p-3.5 text-xs text-gray-700 dark:text-gray-300 min-h-[90px] max-h-[140px] overflow-y-auto leading-relaxed whitespace-pre-wrap rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                      {(selectedNode.data.content || '').slice(0, 300) || <span className="italic opacity-50">Sem conteúdo ainda…</span>}
                      {(selectedNode.data.content || '').length > 300 && <span className="opacity-40">…</span>}
                    </div>

                    {/* Visual block edit button */}
                    <button
                      type="button"
                      onClick={() => setIsBlocksModalOpen(true)}
                      className="w-full py-3 border-2 border-gray-900 dark:border-gray-200 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-350 hover:to-amber-350 text-gray-950 font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                    >
                      <span className="transition-transform group-hover:scale-125">⚡</span>
                      {t('visualBlocks.modalTitle', 'Abrir Editor de Lógica Visual')}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  </div>
                ) : (
                  <textarea
                    disabled={isContentDisabled}
                    className={`w-full flex-1 min-h-[200px] p-2 border-2 border-gray-900 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-none outline-none focus:border-blue-600 transition-all resize-y ${selectedNode.data.nodeType === 'choice' ? 'font-sans text-sm bg-white dark:bg-gray-700' : 'font-mono text-xs bg-gray-900 text-green-400'
                      } ${isContentDisabled ? 'opacity-55 cursor-not-allowed' : ''} ${activeStep?.highlightButton === 'editContent' ? 'tutorial-btn-flash' : ''
                      }`}
                    value={selectedNode.data.content || ''}
                    onChange={(e) => {
                      if (selectedNode.data.nodeType === 'choice') {
                        syncChoicesFromText(selectedNode.id, e.target.value);
                      } else {
                        updateSelectedNode({ content: e.target.value });
                      }
                    }}
                  />
                )}

                {/* SYNTAX WARNINGS */}
                {selectedNode.data.warnings && selectedNode.data.warnings.length > 0 && (
                  <div className="mt-2 p-3 bg-orange-900 border-2 border-orange-500">
                    <span className="block mb-1 font-black uppercase text-[10px] text-orange-400 tracking-widest">{t('inspector.syntaxWarnings')}</span>
                    <ul className="space-y-1 text-orange-100 font-mono text-xs">
                      {selectedNode.data.warnings.map((w, i) => (
                        <li key={i} className="flex items-start">
                          <span className="font-bold text-orange-500 mr-2">[!]</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* DELETE BUTTON */}
          <div className="mt-auto pt-4 border-t-2 border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleteDisabled}
              className={
                "w-full p-3 font-black text-sm uppercase tracking-widest transition-all " +
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
                "border-2 border-gray-900 bg-gray-100 text-gray-900 shadow-[4px_4px_0px_#000] " +
                "hover:bg-red-600 hover:text-white " +
                "dark:bg-gray-800 dark:border-gray-200 dark:text-gray-100 dark:shadow-[4px_4px_0px_#fff] " +
                "dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white cursor-pointer " +
                (isDeleteDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "")
              }
            >
              {t('inspector.deleteNode')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center italic text-gray-400 text-sm text-center px-4">
          {t('inspector.selectNode')}
        </div>
      )}

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