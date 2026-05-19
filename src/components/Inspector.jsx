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

  // --- LÓGICA DE VARIÁVEIS ---

  const extractVariables = (allNodes) => {
    const storyInit = allNodes.find(n => n.data.label === 'StoryInit');
    if (!storyInit || !storyInit.data.content) return [];
    const regex = /\$(\w+)/g;
    const matches = storyInit.data.content.match(regex) || [];
    return [...new Set(matches)];
  };

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

  const handleChangeVariable = () => {
    const existingVars = extractVariables(nodes);
    
    let varName = prompt(
      isLocalVarMode 
      ? "CRIAR VARIÁVEL LOCAL\nNome da variável (ex: $chavePorta):" 
      : `ALTERAR VARIÁVEL EXISTENTE\nVariáveis disponíveis: ${existingVars.join(', ')}`
    );

    if (!varName) return;
    if (!varName.startsWith('$')) varName = `$${varName}`;

    // Validação de existência
    if (!isLocalVarMode && !existingVars.includes(varName)) {
      alert(`Erro: A variável ${varName} não existe no StoryInit!\n\nCrie-a lá primeiro ou ative a checkbox "Criar uma variável só nesta node".`);
      return;
    }

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
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic">
            <strong>ID:</strong> {selectedNode.id}
          </div>

          {/* LABEL FIELD */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">Label (Nome)</label>
              <button type="button" onClick={() => openHelp('Label', 'Identificador do nó', <p>O nome usado para links [[Destino]].</p>)} className={helpButtonClass}>?</button>
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
              <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">Type</label>
              <button type="button" onClick={() => openHelp('Tipo', 'Função do bloco', <p>Define se é história ou código.</p>)} className={helpButtonClass}>?</button>
            </div>
            <select
              className="w-full p-2 border border-gray-400 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={selectedNode.data.nodeType || 'choice'}
              onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
            >
              <option value="choice">Choice (Cena)</option>
              <option value="javascript">JavaScript (Lógica)</option>
              <option value="css">CSS (Estilo)</option>
            </select>
          </div>

          {/* TAGS FIELD */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">Tags</label>
              <button type="button" onClick={() => openHelp('Tags', 'Metadados', <p>Ex: <code>start</code>, <code>secreto</code>.</p>)} className={helpButtonClass}>?</button>
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
              Definir como Começo
            </button>
          </div>

          {/* CONTENT AREA WITH VARIABLE TOOLS */}
          <div className="mb-4 flex-1 flex flex-col">
            <div className="flex flex-col mb-2 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                    {selectedNode.data.nodeType === 'choice' ? 'Texto Narrativo' : 'Código Fonte'}
                  </label>
                  <button type="button" onClick={() => openHelp('Conteúdo', 'Onde a magia acontece', <p>Escreve a tua história ou código aqui.</p>)} className={helpButtonClass}>?</button>
                </div>

                {isStoryInit ? (
                  <button onClick={handleCreateVariable} className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000]">
                    + Criar Variável
                  </button>
                ) : (
                  <button onClick={handleChangeVariable} className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000]">
                    +/- Alterar Valor
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
                    Criar uma variável só nesta node
                  </label>
                </div>
              )}
            </div>

            <textarea
              className={`w-full flex-1 min-h-[200px] p-2 border border-gray-400 dark:border-gray-600 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y ${
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

            {/* SYNTAX WARNINGS */}
            {selectedNode.data.warnings && selectedNode.data.warnings.length > 0 && (
              <div className="mt-2 p-3 bg-orange-900 border-2 border-orange-500">
                <span className="block mb-1 font-black uppercase text-[10px] text-orange-400 tracking-widest">Avisos de Sintaxe:</span>
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
              className="w-full p-3 border-2 border-gray-900 bg-gray-100 hover:bg-red-600 hover:text-white font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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