import React, { useState } from 'react';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';

export default function Inspector({
  selectedNode,
  nodes,
  updateSelectedNode,
  deleteNode,
  syncChoicesFromText,
  setStartNode,
  onOpenVariables,
  onChangeVariables
}) {
  const { showInfoPopout } = useInfoPopout();
  const { t } = useTranslation();

  const [isLocalVarMode, setIsLocalVarMode] = useState(false);

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

  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer text-xs";
  const isStoryInit = selectedNode?.data.label === 'StoryInit';

  const contentHelpBody = (
    <div className="space-y-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      <p className="font-medium italic">
        {t('inspector.help.content.help.subtitle')}
      </p>

      {/* Secção de Variáveis */}
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

      {/* Secção de Escolhas e Links */}
      <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
        <h4 className="font-black uppercase text-xs text-purple-600 dark:text-purple-400 mb-1">
          {t('inspector.help.content.help.linksTitle')}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {t('inspector.help.content.help.linksText')}
        </p>
        <ul className="space-y-1 font-mono text-[11px] bg-gray-100 dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300">
          <li>{t('inspector.help.content.help.linksExample1')}</li>
          <li>{t('inspector.help.content.help.linksExample2')}</li>
          <li>{t('inspector.help.content.help.linksExample3')}</li>
        </ul>
      </div>

      {/* Secção de Localização */}
      <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
        <h4 className="font-black uppercase text-xs text-yellow-600 dark:text-yellow-500 mb-1">
          {t('inspector.help.content.help.i18nTitle')}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {t('inspector.help.content.help.i18nText')}
        </p>
        <ul className="space-y-1 font-mono text-[11px] bg-gray-100 dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300">
          <li>{t('inspector.help.content.help.i18nExample1')}</li>
          <li>{t('inspector.help.content.help.i18nExample2')}</li>
          <li>{t('inspector.help.content.help.i18nExample3')}</li>
        </ul>
      </div>

      {/* Secção de Condicionais */}
      <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
        <h4 className="font-black uppercase text-xs text-red-600 dark:text-red-400 mb-1">
          {t('inspector.help.content.help.logicTitle')}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {t('inspector.help.content.help.logicText')}
        </p>
        <ul className="space-y-1 font-mono text-[11px] bg-gray-100 dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300">
          <li>{t('inspector.help.content.help.logicExample1')}</li>
          <li>{t('inspector.help.content.help.logicExample2')}</li>
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

          {/* LABEL FIELD */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t('inspector.label')}</label>
              <button type="button" onClick={() => openHelp(t('inspector.help.label.title'), t('inspector.help.label.subtitle'), <p>{t('inspector.help.label.text')}</p>)} className={helpButtonClass}>?</button>
            </div>
            <input
              className="w-full p-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white rounded bg-gray-50 dark:bg-gray-700"
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
                    className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000]"
                  >
                    {t('inspector.createVariable')}
                  </button>
                ) : (
                  <button
                    onClick={onChangeVariables ?? handleChangeVariable}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000]"
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

            <textarea
              className={`w-full flex-1 min-h-[200px] p-2 border border-gray-400 dark:border-gray-600 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y ${selectedNode.data.nodeType === 'choice' ? 'font-sans text-sm bg-white dark:bg-gray-700' : 'font-mono text-xs bg-gray-900 text-green-400'
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

          {/* DELETE BUTTON */}
          <div className="mt-auto pt-4 border-t-2 border-gray-200 dark:border-gray-600">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className={
                "w-full p-3 font-black text-sm uppercase tracking-widest transition-all " +
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
                "border-2 border-gray-900 bg-gray-100 text-gray-900 shadow-[4px_4px_0px_#000] " +
                "hover:bg-red-600 hover:text-white " +
                "dark:bg-gray-800 dark:border-gray-200 dark:text-gray-100 dark:shadow-[4px_4px_0px_#fff] " +
                "dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white"
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
    </div>
  );
}
