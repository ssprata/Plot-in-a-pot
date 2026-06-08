// src/components/VisualBlocksEditor.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseLogicFromText, serializeLogicToText } from '../utils/logicParser';

export default function VisualBlocksEditor({
  selectedNode,
  nodes,
  globalVars,
  updateSelectedNode,
  syncChoicesFromText,
  fullscreen = false
}) {
  const { t } = useTranslation();

  // Parse SugarCube text content into structured narrative, setters and choices
  const parsed = useMemo(() => {
    return parseLogicFromText(selectedNode?.data.content || '');
  }, [selectedNode?.data.content]);

  // Extract all globally available variable names
  const varNames = useMemo(() => {
    return Object.keys(globalVars || {});
  }, [globalVars]);

  // Extract all node labels in the graph for selection in target dropdowns
  const nodeLabels = useMemo(() => {
    return (nodes || [])
      .map((n) => n.data?.label)
      .filter(Boolean)
      .filter((label) => label !== 'StoryInit' && label !== 'StoryData' && label !== 'StoryTitle' && label !== 'StoryCaption');
  }, [nodes]);

  // Update selected node content by serializing the structured data back to SugarCube text
  const updateNode = (updatedLogic) => {
    const serialized = serializeLogicToText(updatedLogic);
    if (selectedNode?.data.nodeType === 'choice') {
      syncChoicesFromText(selectedNode.id, serialized);
    } else {
      updateSelectedNode({ content: serialized });
    }
  };

  const handleNarrativeChange = (e) => {
    updateNode({ ...parsed, narrative: e.target.value });
  };

  // Narrative stats
  const narrativeStats = useMemo(() => {
    const text = parsed.narrative || '';
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const readTimeSec = Math.ceil(wordCount / 3.3); // Avg reading speed 200 WPM
    return { charCount, wordCount, readTimeSec };
  }, [parsed.narrative]);

  // --- SETTERS MANAGEMENT ---
  const handleAddSetter = () => {
    const newSetter = { variable: varNames[0] || 'moedas', value: '0' };
    updateNode({ ...parsed, setters: [...parsed.setters, newSetter] });
  };

  const handleUpdateSetter = (index, field, val) => {
    const nextSetters = parsed.setters.map((s, i) => {
      if (i === index) {
        return { ...s, [field]: val };
      }
      return s;
    });
    updateNode({ ...parsed, setters: nextSetters });
  };

  const handleRemoveSetter = (index) => {
    const nextSetters = parsed.setters.filter((_, i) => i !== index);
    updateNode({ ...parsed, setters: nextSetters });
  };

  // --- CHOICES / BRANCHING MANAGEMENT ---
  // Group choices by their condition key (variable||operator||value)
  const groupedChoices = useMemo(() => {
    const groups = [];
    const simples = [];

    // Keep track of original index in parsed.choices to allow direct updates
    parsed.choices.forEach((choice, originalIndex) => {
      const choiceWithIndex = { ...choice, originalIndex };
      if (!choice.condition) {
        simples.push(choiceWithIndex);
      } else {
        const { variable, operator, value } = choice.condition;
        const condKey = `${variable}||${operator}||${value}`;
        let group = groups.find((g) => g.key === condKey);
        if (!group) {
          group = {
            key: condKey,
            condition: { variable, operator, value },
            thenChoices: [],
            elseChoices: []
          };
          groups.push(group);
        }
        if (choice.condition.isElse) {
          group.elseChoices.push(choiceWithIndex);
        } else {
          group.thenChoices.push(choiceWithIndex);
        }
      }
    });

    return { groups, simples };
  }, [parsed.choices]);

  const handleUpdateChoiceField = (originalIndex, field, val) => {
    const nextChoices = parsed.choices.map((c, idx) => {
      if (idx === originalIndex) {
        return { ...c, [field]: val };
      }
      return c;
    });
    updateNode({ ...parsed, choices: nextChoices });
  };

  const handleRemoveChoice = (originalIndex) => {
    const nextChoices = parsed.choices.filter((_, idx) => idx !== originalIndex);
    updateNode({ ...parsed, choices: nextChoices });
  };

  const handleAddSimpleChoice = () => {
    const defaultTarget = nodeLabels[0] || '';
    const newChoice = {
      text: 'Nova Escolha',
      target: defaultTarget,
      condition: null
    };
    updateNode({ ...parsed, choices: [...parsed.choices, newChoice] });
  };

  // Add a new conditional block (groups choices under a new condition)
  const handleAddConditionalBlock = () => {
    const defaultVar = varNames[0] || 'moedas';
    const defaultTarget = nodeLabels[0] || '';
    const newChoice = {
      text: 'Nova Escolha Condicional',
      target: defaultTarget,
      condition: {
        variable: defaultVar,
        operator: 'is',
        value: '0',
        isElse: false
      }
    };
    updateNode({ ...parsed, choices: [...parsed.choices, newChoice] });
  };

  const handleAddChoiceToGroup = (groupCondition, isElse) => {
    const defaultTarget = nodeLabels[0] || '';
    const newChoice = {
      text: isElse ? 'Senão...' : 'Então...',
      target: defaultTarget,
      condition: {
        ...groupCondition,
        isElse: isElse
      }
    };
    updateNode({ ...parsed, choices: [...parsed.choices, newChoice] });
  };

  // Update the condition fields for all choices in a group
  const handleUpdateGroupCondition = (groupKey, field, val) => {
    const nextChoices = parsed.choices.map((c) => {
      if (!c.condition) return c;
      const { variable, operator, value } = c.condition;
      const condKey = `${variable}||${operator}||${value}`;
      if (condKey === groupKey) {
        return {
          ...c,
          condition: {
            ...c.condition,
            [field]: val
          }
        };
      }
      return c;
    });
    updateNode({ ...parsed, choices: nextChoices });
  };

  // Convert choices of a conditional group to simple choices (strip condition)
  const handleConvertGroupToSimple = (groupKey) => {
    const nextChoices = parsed.choices.map((c) => {
      if (!c.condition) return c;
      const { variable, operator, value } = c.condition;
      const condKey = `${variable}||${operator}||${value}`;
      if (condKey === groupKey) {
        return { ...c, condition: null };
      }
      return c;
    });
    updateNode({ ...parsed, choices: nextChoices });
  };

  // Delete all choices in a conditional group
  const handleDeleteGroup = (groupKey) => {
    const nextChoices = parsed.choices.filter((c) => {
      if (!c.condition) return true;
      const { variable, operator, value } = c.condition;
      const condKey = `${variable}||${operator}||${value}`;
      return condKey !== groupKey;
    });
    updateNode({ ...parsed, choices: nextChoices });
  };

  return (
    <div className={`space-y-5 select-none ${fullscreen ? 'pr-1 pb-4' : 'max-h-[380px] overflow-y-auto pr-1'}`}>
      
      {/* 1. Narrative Block (YELLOW BRUTALIST CARD) */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-gray-900 dark:border-amber-400 p-3.5 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#f59e0b] rounded-none">
        <div className="flex items-center justify-between mb-2 select-none">
          <div className="flex items-center gap-2">
            <span className="text-sm">📝</span>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-900 dark:text-amber-300">
              {t('visualBlocks.narrativeTitle', 'Bloco de Texto Narrativo')}
            </label>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 dark:text-gray-400 font-mono">
            <span>{narrativeStats.wordCount} {t('common.words', 'palavras')}</span>
            <span>•</span>
            <span>~{narrativeStats.readTimeSec}s</span>
          </div>
        </div>
        <textarea
          value={parsed.narrative}
          onChange={handleNarrativeChange}
          placeholder={t('visualBlocks.narrativePlaceholder', 'Escreve o texto da cena aqui...')}
          className="w-full p-2 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white rounded-none text-xs min-h-[80px] font-sans outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      {/* 2. Setters Block (GREEN BRUTALIST CARD) */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-gray-900 dark:border-emerald-500 p-3.5 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#10b981] rounded-none">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-gray-300 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚙️</span>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-900 dark:text-emerald-300">
              {t('visualBlocks.settersTitle', 'Variáveis Modificadas ao Entrar')}
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddSetter}
            className="px-2 py-0.5 border-2 border-gray-900 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[9px] uppercase tracking-wider shadow-[1px_1px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none"
          >
            {t('visualBlocks.addSetterBtn', '+ Adicionar Ação')}
          </button>
        </div>

        {parsed.setters.length > 0 ? (
          <div className="space-y-2">
            {parsed.setters.map((setter, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1.5 border-2 border-gray-900 dark:border-gray-700 rounded-none">
                <span className="text-[10px] font-black text-gray-500 uppercase">{t('visualBlocks.setLabel', 'Definir')}</span>
                <span className="font-mono text-gray-400 font-bold select-none text-xs">$</span>
                <select
                  value={setter.variable}
                  onChange={(e) => handleUpdateSetter(idx, 'variable', e.target.value)}
                  className="p-1 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-[10px] font-mono w-28 focus:outline-none focus:border-blue-600 rounded-none cursor-pointer text-gray-900 dark:text-white"
                >
                  {varNames.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                  {!varNames.includes(setter.variable) && (
                    <option value={setter.variable}>{setter.variable}</option>
                  )}
                </select>
                <span className="text-[10px] font-black text-gray-500 uppercase">{t('visualBlocks.toLabel', 'para')}</span>
                <input
                  type="text"
                  value={setter.value}
                  onChange={(e) => handleUpdateSetter(idx, 'value', e.target.value)}
                  className="p-1 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-[10px] font-mono flex-1 min-w-0 focus:outline-none focus:border-blue-600 rounded-none text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSetter(idx)}
                  className="p-1 text-red-600 hover:text-red-500 font-black text-xs cursor-pointer select-none"
                  title="Remove Variable Change"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic py-1">{t('visualBlocks.noSetters', 'Nenhuma variável é modificada ao entrar.')}</p>
        )}
      </div>

      {/* 3. Conditional Groups (PURPLE/INDIGO BRUTALIST GRID DESIGN) */}
      {groupedChoices.groups.map((group) => (
        <div
          key={group.key}
          className="bg-indigo-50 dark:bg-indigo-950/20 border-2 border-gray-900 dark:border-indigo-500 p-3.5 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#6366f1] relative rounded-none"
        >
          {/* Header with Group Condition Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-3 border-b-2 border-gray-900 dark:border-indigo-800 bg-transparent text-gray-900 dark:text-white">
            <span className="text-sm">⚡</span>
            <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
              {t('visualBlocks.ifLabel', 'SE (Condição)')}
            </span>
            <span className="font-mono text-gray-400 font-bold select-none text-xs">$</span>
            
            <select
              value={group.condition.variable}
              onChange={(e) => handleUpdateGroupCondition(group.key, 'variable', e.target.value)}
              className="p-1 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-[9px] font-mono focus:outline-none focus:border-blue-600 rounded-none cursor-pointer text-gray-900 dark:text-white w-24"
            >
              {varNames.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
              {!varNames.includes(group.condition.variable) && (
                <option value={group.condition.variable}>{group.condition.variable}</option>
              )}
            </select>

            <select
              value={group.condition.operator}
              onChange={(e) => handleUpdateGroupCondition(group.key, 'operator', e.target.value)}
              className="p-1 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-[9px] font-black focus:outline-none focus:border-blue-600 rounded-none cursor-pointer text-gray-900 dark:text-white w-14"
            >
              <option value="is">==</option>
              <option value="isnot">!=</option>
              <option value="gt">&gt;</option>
              <option value="gte">&gt;=</option>
              <option value="lt">&lt;</option>
              <option value="lte">&lt;=</option>
            </select>

            <input
              type="text"
              value={group.condition.value}
              onChange={(e) => handleUpdateGroupCondition(group.key, 'value', e.target.value)}
              className="p-1 border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-950 text-[9px] font-mono flex-1 min-w-[30px] focus:outline-none focus:border-blue-600 rounded-none text-gray-900 dark:text-white"
            />

            {/* Action Buttons for Group */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => handleConvertGroupToSimple(group.key)}
                className="p-1 border border-gray-900 dark:border-gray-650 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 shadow-[1px_1px_0px_#000] cursor-pointer rounded-none"
                title={t('visualBlocks.deleteConditionBtn')}
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGroup(group.key)}
                className="p-1 border border-red-900 bg-red-100 hover:bg-red-200 text-[9px] font-black uppercase text-red-650 shadow-[1px_1px_0px_#000] cursor-pointer rounded-none"
                title={t('visualBlocks.deleteBlockBtn')}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Visual flowchart split-tree connector lines (Brutalist style) */}
          <div className="hidden md:flex justify-center items-center h-8 relative select-none">
            <div className="absolute top-0 w-0.5 h-full bg-gray-900 dark:bg-indigo-900/40"></div>
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 dark:bg-indigo-900/40"></div>
          </div>

          {/* Side-by-side branch comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Visual connector lines on grid columns */}
            <div className="hidden md:block absolute top-[-8px] left-[25%] w-0.5 h-2 bg-gray-900 dark:bg-indigo-900/40"></div>
            <div className="hidden md:block absolute top-[-8px] right-[25%] w-0.5 h-2 bg-gray-900 dark:bg-indigo-900/40"></div>

            {/* THEN BRANCH (If True) */}
            <div className="flex flex-col border-2 border-gray-900 dark:border-gray-750 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#10b981]">
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-500 text-white border-b-2 border-gray-900 dark:border-emerald-800">
                <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  ✔️ {t('visualBlocks.thenLabel', 'ENTÃO (Se Sim)')}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddChoiceToGroup(group.condition, false)}
                  className="px-2 py-0.5 border border-white bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[8px] uppercase cursor-pointer rounded-none"
                >
                  {t('visualBlocks.addChoiceThen', '+ Escolha')}
                </button>
              </div>

              <div className="p-3 space-y-3 flex-1">
                {group.thenChoices.length > 0 ? (
                  <div className="space-y-2">
                    {group.thenChoices.map((choice) => (
                      <div key={choice.originalIndex} className="flex flex-col gap-1.5 p-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-none relative group">
                        <div className="flex items-center gap-1.5 pr-5">
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'text', e.target.value)}
                            placeholder={t('visualBlocks.choicePlaceholder')}
                            className="p-1 border border-gray-900 dark:border-gray-650 bg-white dark:bg-gray-950 text-[10px] font-bold flex-1 min-w-0 text-gray-900 dark:text-white outline-none focus:border-blue-600 rounded-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(choice.originalIndex)}
                            className="absolute top-2 right-2 p-0.5 text-red-650 hover:text-red-500 font-black text-xs cursor-pointer select-none"
                            title={t('visualBlocks.deleteChoiceTooltip')}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{t('visualBlocks.linkDestination')}</span>
                          <select
                            value={choice.target}
                            onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'target', e.target.value)}
                            className="p-0.5 border border-gray-900 dark:border-gray-655 bg-white dark:bg-gray-950 text-[9px] font-mono flex-1 cursor-pointer text-gray-900 dark:text-white rounded-none"
                          >
                            <option value="">{t('visualBlocks.selectDestination', 'Sem destino')}</option>
                            {nodeLabels.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 italic pl-1 text-center py-2">{t('visualBlocks.noChoices')}</p>
                )}
              </div>
            </div>

            {/* ELSE BRANCH (If False) */}
            <div className="flex flex-col border-2 border-gray-900 dark:border-gray-750 bg-orange-50/20 dark:bg-orange-950/10 rounded-none shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#f97316]">
              <div className="flex items-center justify-between px-3 py-2 bg-orange-500 text-white border-b-2 border-gray-900 dark:border-orange-850">
                <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  ❌ {t('visualBlocks.elseLabel', 'SENÃO (Senão)')}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddChoiceToGroup(group.condition, true)}
                  className="px-2 py-0.5 border border-white bg-orange-655 hover:bg-orange-550 text-white font-black text-[8px] uppercase cursor-pointer rounded-none"
                >
                  {t('visualBlocks.addChoiceElse', '+ Escolha')}
                </button>
              </div>

              <div className="p-3 space-y-3 flex-1">
                {group.elseChoices.length > 0 ? (
                  <div className="space-y-2">
                    {group.elseChoices.map((choice) => (
                      <div key={choice.originalIndex} className="flex flex-col gap-1.5 p-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-none relative group">
                        <div className="flex items-center gap-1.5 pr-5">
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'text', e.target.value)}
                            placeholder={t('visualBlocks.choicePlaceholder')}
                            className="p-1 border border-gray-900 dark:border-gray-650 bg-white dark:bg-gray-950 text-[10px] font-bold flex-1 min-w-0 text-gray-900 dark:text-white outline-none focus:border-blue-600 rounded-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(choice.originalIndex)}
                            className="absolute top-2 right-2 p-0.5 text-red-655 hover:text-red-500 font-black text-xs cursor-pointer select-none"
                            title={t('visualBlocks.deleteChoiceTooltip')}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{t('visualBlocks.linkDestination')}</span>
                          <select
                            value={choice.target}
                            onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'target', e.target.value)}
                            className="p-0.5 border border-gray-900 dark:border-gray-655 bg-white dark:bg-gray-950 text-[9px] font-mono flex-1 cursor-pointer text-gray-900 dark:text-white rounded-none"
                          >
                            <option value="">{t('visualBlocks.selectDestination', 'Sem destino')}</option>
                            {nodeLabels.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 italic pl-1 text-center py-2">{t('visualBlocks.noChoices')}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      ))}

      {/* 4. Simple Choices Block (BLUE BRUTALIST CARD) */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-gray-900 dark:border-blue-500 p-3 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#3b82f6] rounded-none">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-gray-300 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔗</span>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-900 dark:text-blue-300">
              {t('visualBlocks.simpleChoicesTitle', 'Escolhas Simples (Sem Condição)')}
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddSimpleChoice}
            className="px-2 py-0.5 border-2 border-gray-900 bg-blue-500 hover:bg-blue-400 text-white font-black text-[9px] uppercase tracking-wider shadow-[1px_1px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none"
          >
            {t('visualBlocks.addSimpleChoiceBtn', '+ Adicionar')}
          </button>
        </div>

        {groupedChoices.simples.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedChoices.simples.map((choice) => (
              <div key={choice.originalIndex} className="flex flex-col gap-1.5 p-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-none relative group">
                <div className="flex items-center gap-1.5 pr-5">
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'text', e.target.value)}
                    placeholder={t('visualBlocks.choicePlaceholder')}
                    className="p-1 border border-gray-900 dark:border-gray-650 bg-white dark:bg-gray-950 text-[10px] font-bold flex-1 min-w-0 text-gray-900 dark:text-white outline-none focus:border-blue-600 rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(choice.originalIndex)}
                    className="absolute top-2.5 right-2.5 p-0.5 text-red-655 hover:text-red-500 font-black text-xs cursor-pointer select-none"
                    title={t('visualBlocks.deleteChoiceTooltip')}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">{t('visualBlocks.linkDestination')}</span>
                  <select
                    value={choice.target}
                    onChange={(e) => handleUpdateChoiceField(choice.originalIndex, 'target', e.target.value)}
                    className="p-0.5 border border-gray-900 dark:border-gray-655 bg-white dark:bg-gray-950 text-[9px] font-mono flex-1 cursor-pointer text-gray-900 dark:text-white rounded-none"
                  >
                    <option value="">{t('visualBlocks.selectDestination', 'Sem destino')}</option>
                    {nodeLabels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic py-1">{t('visualBlocks.noChoices')}</p>
        )}
      </div>

      {/* Toolbar at the bottom of the editor to add new logical blocks */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddConditionalBlock}
          className="flex-1 py-1.5 border-2 border-gray-900 bg-indigo-650 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none"
        >
          {t('visualBlocks.addConditionalBlockBtn', '+ Novo Bloco Condicional')}
        </button>
      </div>
      
    </div>
  );
}
