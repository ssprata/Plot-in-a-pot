import React, { useState } from 'react';
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function Inspector({
  selectedNode,
  nodes,
  updateSelectedNode,
  deleteNode,
  syncChoicesFromText,
  setStartNode
}) {
  const { showInfoPopout } = useInfoPopout();
  
  // Estado para a checkbox de variável local
  const [isLocalVarMode, setIsLocalVarMode] = useState(false);

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  // --- EXTRAIR VARIÁVEIS DO STORYINIT ---
  const extractVariables = (allNodes) => {
    const storyInit = allNodes.find(n => n.data.label === 'StoryInit');
    if (!storyInit || !storyInit.data.content) return [];
    
    const regex = /\$(\w+)/g;
    const matches = storyInit.data.content.match(regex) || [];
    return [...new Set(matches)]; // Retorna lista única: ["$ouro", "$vida"]
  };

  // --- CRIAR VARIÁVEL (STORYINIT) ---
  const handleCreateVariable = () => {
    const name = prompt("Nome da variável global (ex: ouro):");
    if (!name) return;
    
    const cleanName = name.startsWith('$') ? name : `$${name}`;
    const value = prompt(`Valor inicial para ${cleanName}:`, "0");
    if (value === null) return;

    const newMacro = `<<set ${cleanName} to ${value}>>\n`;
    const oldContent = selectedNode.data.content || "";
    updateSelectedNode({ content: newMacro + oldContent });
  };

  // --- ALTERAR VARIÁVEL (OUTROS NÓS) ---
  const handleChangeVariable = () => {
    const existingVars = extractVariables(nodes);
    
    // 1. Pedir o nome da variável
    let varName = prompt(
      isLocalVarMode 
      ? "CRIAR VARIÁVEL LOCAL\nNome da variável (ex: $chavePorta):" 
      : `ALTERAR VARIÁVEL EXISTENTE\nVariáveis disponíveis: ${existingVars.join(', ')}`
    );

    if (!varName) return;
    if (!varName.startsWith('$')) varName = `$${varName}`;

    // 2. Validação: Se não for modo local, a variável TEM de existir no StoryInit
    if (!isLocalVarMode && !existingVars.includes(varName)) {
      alert(`Erro: A variável ${varName} não foi inicializada no StoryInit!\n\nInicialize-a lá primeiro ou ative a checkbox "Variável Local".`);
      return;
    }

    // 3. Pedir o valor
    const newValue = prompt(`Novo valor para ${varName}:`);
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

  return (
    <div className="w-[340px] p-3 border-r-2 border-gray-300 dark:border-gray-600 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col h-full shadow-md">
      <h3 className="mt-0 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4 text-lg font-bold text-gray-800 dark:text-gray-200">
        Inspector
      </h3>

      {selectedNode ? (
        <div className="flex-1 flex flex-col">
          {/* ... (Campos de ID, Label, Type e Tags mantêm-se iguais) ... */}
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">Label (Nome)</label>
            </div>
            <input
              className="w-full p-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white rounded bg-gray-50 dark:bg-gray-700"
              value={selectedNode.data.label || ''}
              onChange={(e) => updateSelectedNode({ label: e.target.value })}
            />
          </div>

          <div className="mb-4 flex-1 flex flex-col">
            <div className="flex flex-col mb-2 gap-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  {selectedNode.data.nodeType === 'choice' ? 'Texto Narrativo' : 'Código Fonte'}
                </label>

                {/* BOTÕES DE AÇÃO */}
                {isStoryInit ? (
                  <button
                    onClick={handleCreateVariable}
                    className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-blue-500 active:shadow-none active:translate-y-0.5"
                  >
                    + Criar Variável
                  </button>
                ) : (
                  <button
                    onClick={handleChangeVariable}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-emerald-500 active:shadow-none active:translate-y-0.5"
                  >
                    +/- Alterar Valor
                  </button>
                )}
              </div>

              {/* CHECKBOX PARA VARIÁVEL LOCAL (Só aparece se não for StoryInit) */}
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
                    Criar uma variável só nesta node
                  </label>
                </div>
              )}
            </div>

            <textarea
              className={`w-full flex-1 min-h-[250px] p-2 border border-gray-400 dark:border-gray-600 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y ${
                selectedNode.data.nodeType === 'choice' ? 'font-sans text-sm bg-white dark:bg-gray-700' : 'font-mono text-xs bg-gray-900 text-green-400'
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
          </div>

          <div className="mt-auto pt-4 border-t-2 border-gray-200 dark:border-gray-600">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="w-full p-3 border-2 border-gray-900 bg-gray-100 hover:bg-red-600 hover:border-red-600 hover:text-white cursor-pointer font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-gray-200 dark:bg-gray-600 dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white"
            >
              Apagar Nó
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center italic text-gray-400 text-sm text-center px-4">
          Seleciona um nó para editar.
        </div>
      )}
    </div>
  );
}