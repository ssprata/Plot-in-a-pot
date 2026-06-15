import React, { useState, useEffect, useMemo } from 'react';

const OPERATORS = [
  { value: 'is',     label: 'é igual a (is)' },
  { value: 'isnot',  label: 'é diferente de (isnot)' },
  { value: 'gt',     label: 'maior que (>)' },
  { value: 'gte',    label: 'maior ou igual (>=)' },
  { value: 'lt',     label: 'menor que (<)' },
  { value: 'lte',    label: 'menor ou igual (<=)' },
];

// Groups nodes by their tags for the dropdown. Nodes with no tags go under "Sem tag".
// FIX 1: Cada nó é adicionado a cada grupo apenas uma vez (sem duplicados por múltiplas tags).
function groupNodesByTag(nodes) {
  const groups = {};
  const seen = new Set(); // rastreia nós já adicionados a um grupo

  nodes.forEach(n => {
    const tagsRaw = Array.isArray(n.data.tags)
      ? n.data.tags.join(',')
      : String(n.data.tags || '');
    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(t => t && t.toLowerCase() !== 'secreto' && t.toLowerCase() !== 'start');

    if (tags.length === 0) {
      (groups['Sem tag'] = groups['Sem tag'] || []).push(n);
    } else {
      tags.forEach(tag => {
        // Só adiciona ao grupo se ainda não foi adicionado a nenhum grupo
        if (!seen.has(n.id)) {
          seen.add(n.id);
          (groups[tag] = groups[tag] || []).push(n);
        }
      });
    }
  });
  return groups;
}

export default function ConnectionModal({
  isOpen, onClose, onConfirm, params, nodes = [], globalVars = {}, activeStep
}) {
  const [mode, setMode] = useState('simple'); // 'simple' | 'conditional'
  const [choiceText, setChoiceText] = useState('');
  const [ifVariable, setIfVariable] = useState('');
  const [ifOperator, setIfOperator] = useState('is');
  const [ifValue, setIfValue] = useState('');
  const [ifTargetNodeId, setIfTargetNodeId] = useState('');
  const [elseTargetNodeId, setElseTargetNodeId] = useState('');

  const sourceNode = useMemo(() => nodes.find(n => n.id === params?.source), [nodes, params]);
  const directTarget = useMemo(() => nodes.find(n => n.id === params?.target), [nodes, params]);

  // All nodes except the source itself — available for conditional targets
  const availableNodes = useMemo(() =>
    nodes.filter(n => n.id !== params?.source),
    [nodes, params]
  );

  const groupedNodes = useMemo(() => groupNodesByTag(availableNodes), [availableNodes]);
  const varNames = useMemo(() => Object.keys(globalVars), [globalVars]);

  // FIX 2: varNames adicionado às dependências para o reset usar sempre a lista atualizada
  useEffect(() => {
    if (isOpen) {
      setMode('simple');
      setChoiceText('');
      setIfVariable(varNames[0] || '');
      setIfOperator('is');
      setIfValue('');
      setIfTargetNodeId(params?.target || '');
      setElseTargetNodeId('');
    }
  }, [isOpen, varNames]);

  if (!isOpen || !params) return null;

  // FIX 3: Resolver os nós do preview uma vez, em vez de 4× dentro do JSX
  const ifTargetNode = nodes.find(n => n.id === ifTargetNodeId);
  const elseTargetNode = nodes.find(n => n.id === elseTargetNodeId);

  const isConditionValid = ifVariable && ifValue && ifTargetNodeId;

  const highlightTab = activeStep?.highlightButton === 'connectModalFields' && mode === 'simple';
  const highlightVar = activeStep?.highlightButton === 'connectModalFields' && mode === 'conditional' && !ifVariable;
  const highlightVal = activeStep?.highlightButton === 'connectModalFields' && mode === 'conditional' && ifVariable && !ifValue;
  const highlightText = activeStep?.highlightButton === 'connectModalFields' && mode === 'conditional' && ifVariable && ifValue && !choiceText;
  const highlightConfirm = activeStep?.highlightButton === 'connectModalFields' && mode === 'conditional' && isConditionValid && choiceText;

  const handleConfirm = () => {
    if (mode === 'simple') {
      onConfirm({ type: 'simple', choiceText, params });
    } else {
      if (!ifVariable || !ifValue || !ifTargetNodeId) return;
      onConfirm({
        type: 'conditional',
        choiceText,
        params,
        ifVariable,
        ifOperator,
        ifValue,
        ifTargetNodeId,
        elseTargetNodeId: elseTargetNodeId || null,
      });
    }
  };

  const NodeSelect = ({ value, onChange, placeholder = 'Seleciona um nó...' }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-2 border-2 border-gray-800 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs rounded"
    >
      <option value="">{placeholder}</option>
      {Object.entries(groupedNodes).map(([tag, tagNodes]) => (
        <optgroup key={tag} label={`# ${tag}`}>
          {tagNodes.map(n => (
            <option key={n.id} value={n.id}>{n.data.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const btnBase = "px-4 py-2 font-black text-xs uppercase border-2 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none active:translate-y-0.5";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 w-[34rem] shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-700">
          <div>
            <h2 className="font-black uppercase tracking-widest text-sm text-gray-900 dark:text-gray-100">
              Nova Ligação
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              {sourceNode?.data.label} → {directTarget?.data.label}
            </p>
          </div>
          <button onClick={onClose} className="font-black text-base px-2 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('simple')}
              className={`flex-1 py-2 text-[11px] font-black uppercase border-2 transition-colors ${mode === 'simple'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 border-gray-900 dark:border-gray-100'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Ligação Simples
            </button>
            <button
              onClick={() => setMode('conditional')}
              className={`flex-1 py-2 text-[11px] font-black uppercase border-2 transition-colors ${highlightTab ? 'tutorial-btn-flash' : ''} ${mode === 'conditional'
                ? 'bg-indigo-600 text-white border-indigo-800'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Condicional ⚡
            </button>
          </div>

          {/* Shared: choice text */}
          <div className="mb-4">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              Texto da escolha
            </label>
            <input
              className={`w-full p-2 border-2 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded font-sans ${highlightText ? 'tutorial-btn-flash' : ''}`}
              placeholder={directTarget?.data.label || 'Texto que o jogador vê...'}
              value={choiceText}
              onChange={e => setChoiceText(e.target.value)}
            />
          </div>

          {/* Simple mode — just shows the target info */}
          {mode === 'simple' && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-500 dark:text-gray-400 font-mono">
              Vai escrever: <span className="text-indigo-600 dark:text-indigo-300 font-black">
                [[{choiceText || directTarget?.data.label}|{directTarget?.data.label}]]
              </span>
            </div>
          )}

          {/* Conditional mode */}
          {mode === 'conditional' && (
            <div className="space-y-4">

              {/* Condition row */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Condição — se…
                </label>
                <div className="flex gap-2">
                  {/* Variable picker */}
                  <select
                    value={ifVariable}
                    onChange={e => setIfVariable(e.target.value)}
                    className={`flex-1 p-2 border-2 border-gray-800 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs rounded ${highlightVar ? 'tutorial-btn-flash' : ''}`}
                  >
                    <option value="">$variável</option>
                    {varNames.map(v => (
                      <option key={v} value={v}>${v}</option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={ifOperator}
                    onChange={e => setIfOperator(e.target.value)}
                    className="w-36 p-2 border-2 border-gray-800 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value */}
                  <input
                    className={`w-28 p-2 border-2 border-gray-800 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs rounded ${highlightVal ? 'tutorial-btn-flash' : ''}`}
                    placeholder="valor"
                    value={ifValue}
                    onChange={e => setIfValue(e.target.value)}
                  />
                </div>
              </div>

              {/* If-true target */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">
                  ✓ Se verdade → vai para
                </label>
                <NodeSelect value={ifTargetNodeId} onChange={setIfTargetNodeId} placeholder="Seleciona o nó de destino..." />
              </div>

              {/* Else target (optional) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 mb-1">
                  ✗ Senão (else) → vai para <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                </label>
                <NodeSelect value={elseTargetNodeId} onChange={setElseTargetNodeId} placeholder="Sem else (nó termina aqui)" />
              </div>

              {/* FIX 3 aplicado: usar ifTargetNode e elseTargetNode resolvidos acima */}
              {isConditionValid && (
                <div className="p-3 bg-gray-900 rounded border border-gray-600 font-mono text-[11px] leading-relaxed">
                  <div className="text-purple-400">{`<<if $${ifVariable} ${ifOperator} ${ifValue}>>`}</div>
                  <div className="text-green-300 pl-2">
                    {`[[${choiceText || ifTargetNode?.data.label}|${ifTargetNode?.data.label}]]`}
                  </div>
                  {elseTargetNodeId && (
                    <>
                      <div className="text-purple-400">{`<<else>>`}</div>
                      <div className="text-yellow-300 pl-2">
                        {`[[${elseTargetNode?.data.label}|${elseTargetNode?.data.label}]]`}
                      </div>
                    </>
                  )}
                  <div className="text-purple-400">{`<</if>>`}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className={`${btnBase} border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={mode === 'conditional' && !isConditionValid}
            className={`${btnBase} border-gray-900 dark:border-gray-100 text-white ${highlightConfirm ? 'tutorial-btn-flash' : ''} ${
              mode === 'conditional' && !isConditionValid
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700'
            }`}
          >
            Confirmar Ligação
          </button>
        </div>
      </div>
    </div>
  );
}