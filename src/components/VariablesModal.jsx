import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DeleteConfirmModal from './DeleteConfirmModal';

// Infers the type of a variable from its raw string value
function inferType(value) {
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 'false') return 'boolean';
  if (v !== '' && !isNaN(Number(v))) return 'number';
  return 'string';
}

// Strips surrounding quotes for display in the input box
function stripQuotes(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// Wraps string in quotes, ensures booleans and numbers are typed correctly for SugarCube
function formatValueForSave(val, type) {
  if (type === 'boolean') {
    return String(val).trim().toLowerCase() === 'true' ? 'true' : 'false';
  }
  if (type === 'number') {
    const num = Number(val);
    return isNaN(num) ? '0' : String(num);
  }
  // string
  const trimmed = String(val).trim();
  if (trimmed.startsWith('$')) return trimmed; // variable reference
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed;
  }
  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

// Helper to parse SugarCube variables
const parseVariablesFromText = (text = '') => {
  const vars = {};
  const regex = /<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
};

// Helper to stringify variables to SugarCube format
const stringifyVariablesToText = (vars) => {
  return Object.entries(vars)
    .map(([key, val]) => `<<set $${key} to ${val}>>`)
    .join('\n');
};

export default function VariablesModal({
  isOpen,
  onClose,
  selectedNode,
  nodes,
  setNodes,
  takeSnapshot,
  initialMode
}) {
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');

  // Text dictionary mapped directly to central i18n translations
  const txt = useMemo(() => ({
    title: t('variablesModal.title'),
    globalScope: t('variablesModal.globalScope'),
    localScope: t('variablesModal.localScope'),
    searchPlaceholder: t('variablesModal.searchPlaceholder'),
    createBtn: t('variablesModal.createBtn'),
    colName: t('variablesModal.colName'),
    colType: t('variablesModal.colType'),
    colValue: t('variablesModal.colValue'),
    colLocalValue: t('variablesModal.colLocalValue'),
    activeInScene: t('variablesModal.activeInScene'),
    renameHint: t('variablesModal.renameHint'),
    noVars: t('variablesModal.noVars'),
    noVarsGlobalDesc: t('variablesModal.noVarsGlobalDesc'),
    noVarsLocalDesc: t('variablesModal.noVarsLocalDesc'),
    confirmDeleteTitle: t('variablesModal.confirmDeleteTitle'),
    typeNumber: t('variablesModal.typeNumber'),
    typeString: t('variablesModal.typeString'),
    typeBoolean: t('variablesModal.typeBoolean'),
    delete: t('variablesModal.delete'),
    cancel: t('variablesModal.cancel'),
    close: t('variablesModal.close'),
    allTypes: t('variablesModal.allTypes'),
    sceneContext: t('variablesModal.sceneContext')
  }), [t]);

  // Modal States
  const [activeCollection, setActiveCollection] = useState('global'); // 'global' | 'local'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'number' | 'string' | 'boolean'
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [activeTypeDropdown, setActiveTypeDropdown] = useState(null); // variable key or null
  const [pendingDelete, setPendingDelete] = useState(null);

  // Local state copy of variables for instant reactivity
  const [globalVars, setGlobalVars] = useState({});
  const [localVars, setLocalVars] = useState({});

  const createMenuRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // Load variables on mount or when nodes change
  useEffect(() => {
    if (isOpen) {
      const storyInit = nodes.find(n => n.data.label.toLowerCase() === 'storyinit');
      const parsedGlobals = storyInit ? parseVariablesFromText(storyInit.data.content) : {};
      setGlobalVars(parsedGlobals);

      const parsedLocals = selectedNode ? parseVariablesFromText(selectedNode.data.content) : {};
      setLocalVars(parsedLocals);

      const isStoryInitSelected = selectedNode?.data.label.toLowerCase() === 'storyinit';
      if (initialMode === 'change' && selectedNode && !isStoryInitSelected) {
        setActiveCollection('local');
      } else {
        setActiveCollection('global');
      }
    }
  }, [isOpen, nodes, selectedNode, initialMode]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
        setIsCreateMenuOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setActiveTypeDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isStoryInitSelected = selectedNode?.data.label.toLowerCase() === 'storyinit';
  const showLocalScope = selectedNode && !isStoryInitSelected;

  // Compute lists of all variables
  // If there are variables used in other nodes that are not in StoryInit, collect them as global fallback
  const allGlobalVarsComputed = useMemo(() => {
    const vars = { ...globalVars };
    // Scan all nodes for variable declarations to be safe
    (nodes || []).forEach(node => {
      const nodeVars = parseVariablesFromText(node.data.content);
      Object.keys(nodeVars).forEach(k => {
        if (!(k in vars)) {
          vars[k] = nodeVars[k];
        }
      });
    });
    return vars;
  }, [globalVars, nodes]);

  // Helper to save updates to nodes state
  const saveChangesToNodes = (nextGlobals, nextLocals) => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        // Update StoryInit
        if (node.data.label.toLowerCase() === 'storyinit') {
          const oldContent = node.data.content || '';
          const cleanedContent = oldContent
            .replace(/<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>\n?/g, '')
            .trim();
          const varBlock = stringifyVariablesToText(nextGlobals);
          const newContent = varBlock ? `${varBlock}\n\n${cleanedContent}` : cleanedContent;
          return { ...node, data: { ...node.data, content: newContent } };
        }
        // Update current selected node (if local changes are allowed)
        if (selectedNode && node.id === selectedNode.id) {
          const oldContent = node.data.content || '';
          const cleanedContent = oldContent
            .replace(/<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>\n?/g, '')
            .trim();
          const varBlock = stringifyVariablesToText(nextLocals);
          const newContent = varBlock ? `${varBlock}\n\n${cleanedContent}` : cleanedContent;
          return { ...node, data: { ...node.data, content: newContent } };
        }
        return node;
      });
    });
  };

  // 1. Create a variable (Global scope)
  const handleCreateVariable = (type) => {
    takeSnapshot();
    setIsCreateMenuOpen(false);

    // Find unique variable name
    let baseName = 'var';
    let nameNum = 1;
    let newName = `${baseName}${nameNum}`;
    while (newName in allGlobalVarsComputed) {
      nameNum++;
      newName = `${baseName}${nameNum}`;
    }

    // Default value based on type
    let defaultValue = '""';
    if (type === 'number') defaultValue = '0';
    if (type === 'boolean') defaultValue = 'false';

    const updatedGlobals = { ...globalVars, [newName]: defaultValue };
    setGlobalVars(updatedGlobals);

    // If active scope is local, check/activate it locally as well
    let updatedLocals = { ...localVars };
    if (activeCollection === 'local') {
      updatedLocals[newName] = defaultValue;
      setLocalVars(updatedLocals);
    }

    saveChangesToNodes(updatedGlobals, updatedLocals);
  };

  // 2. Rename a variable with global propagation
  const handleRenameVariable = (oldKey, newKey) => {
    if (!oldKey || !newKey || oldKey === newKey) return;
    const cleanOld = oldKey.trim().replace(/^\$/, '');
    const cleanNew = newKey.trim().replace(/^\$/, '');

    // Validate name (letters, numbers, underscores, cannot start with number)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanNew)) {
      alert(isPt ? 'Nome de variável inválido.' : 'Invalid variable name.');
      return;
    }

    // Propagate rename to all nodes content
    takeSnapshot();
    setNodes(prev => prev.map(node => {
      const oldContent = node.data.content || '';
      const newContent = oldContent.replace(new RegExp('\\$' + cleanOld + '\\b', 'g'), '$' + cleanNew);
      return {
        ...node,
        data: {
          ...node.data,
          content: newContent
        }
      };
    }));

    // Update local states
    const updatedGlobals = { ...globalVars };
    updatedGlobals[cleanNew] = updatedGlobals[cleanOld];
    delete updatedGlobals[cleanOld];
    setGlobalVars(updatedGlobals);

    const updatedLocals = { ...localVars };
    if (cleanOld in updatedLocals) {
      updatedLocals[cleanNew] = updatedLocals[cleanOld];
      delete updatedLocals[cleanOld];
      setLocalVars(updatedLocals);
    }
  };

  // 3. Update value (Global default or local override)
  const handleUpdateValue = (key, rawValue, scope = activeCollection) => {
    if (scope === 'global') {
      const type = inferType(globalVars[key]);
      const formatted = formatValueForSave(rawValue, type);
      const updatedGlobals = { ...globalVars, [key]: formatted };
      setGlobalVars(updatedGlobals);
      saveChangesToNodes(updatedGlobals, localVars);
    } else {
      const type = inferType(allGlobalVarsComputed[key] || '');
      const formatted = formatValueForSave(rawValue, type);
      const updatedLocals = { ...localVars, [key]: formatted };
      setLocalVars(updatedLocals);
      saveChangesToNodes(globalVars, updatedLocals);
    }
  };

  // 4. Update type of a variable
  const handleChangeType = (key, targetType) => {
    takeSnapshot();
    setActiveTypeDropdown(null);

    let defaultValue = '""';
    if (targetType === 'number') defaultValue = '0';
    if (targetType === 'boolean') defaultValue = 'false';

    const updatedGlobals = { ...globalVars, [key]: defaultValue };
    setGlobalVars(updatedGlobals);

    // If overridden locally, update local override to match type too
    const updatedLocals = { ...localVars };
    if (key in updatedLocals) {
      updatedLocals[key] = defaultValue;
      setLocalVars(updatedLocals);
    }

    saveChangesToNodes(updatedGlobals, updatedLocals);
  };

  // 5. Delete variable definition globally
  const confirmDelete = () => {
    if (!pendingDelete) return;
    takeSnapshot();

    const updatedGlobals = { ...globalVars };
    delete updatedGlobals[pendingDelete];
    setGlobalVars(updatedGlobals);

    const updatedLocals = { ...localVars };
    delete updatedLocals[pendingDelete];
    setLocalVars(updatedLocals);

    // Clean declarations from all nodes
    setNodes(prev => prev.map(node => {
      const oldContent = node.data.content || '';
      const cleanedContent = oldContent
        .replace(new RegExp(`<<set\\s+\\$${pendingDelete}\\s*(?:to|=)\\s*.*?>>\\n?`, 'g'), '')
        .trim();
      return {
        ...node,
        data: {
          ...node.data,
          content: cleanedContent
        }
      };
    }));

    setPendingDelete(null);
  };

  // 6. Activate/Deactivate local override
  const handleToggleLocalActive = (key, active) => {
    takeSnapshot();
    const updatedLocals = { ...localVars };
    if (active) {
      // Set to current global value
      updatedLocals[key] = allGlobalVarsComputed[key] || '0';
    } else {
      delete updatedLocals[key];
    }
    setLocalVars(updatedLocals);
    saveChangesToNodes(globalVars, updatedLocals);
  };

  // Filter list of variables to display in table
  const displayedVars = useMemo(() => {
    const list = activeCollection === 'global' ? allGlobalVarsComputed : allGlobalVarsComputed;
    
    return Object.entries(list)
      .map(([key, value]) => {
        const type = inferType(value);
        const isLocalActive = key in localVars;
        const localValue = localVars[key];
        return { key, value, type, isLocalActive, localValue };
      })
      .filter(item => {
        // Search query filter
        if (searchQuery.trim() !== '') {
          if (!item.key.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        // Type filter
        if (filterType !== 'all') {
          if (item.type !== filterType) {
            return false;
          }
        }
        return true;
      });
  }, [activeCollection, allGlobalVarsComputed, localVars, searchQuery, filterType]);

  // Color mappings for Figma badges
  const typeStyles = {
    boolean: {
      label: 'bool',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-400'
    },
    number: {
      label: 'num',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
      badge: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-400'
    },
    string: {
      label: 'str',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      badge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs">
      {/* Modal Card - Neo-Brutalist style: bold border, solid shadow, no rounding */}
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col w-[900px] h-[600px] overflow-hidden transition-all text-sm animate-fade-in-down rounded-none">
        
        {/* Header - Brutalist style */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-yellow-400 text-gray-900 border-2 border-gray-900 rounded-none shadow-[2px_2px_0px_#000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">{txt.title}</h2>
              {selectedNode && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                  <span>{txt.sceneContext}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-gray-850 dark:text-gray-250 border border-gray-900 dark:border-gray-400 font-mono">
                    {selectedNode.data.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-black text-base px-3 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white hover:border-red-600 dark:hover:border-red-650 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none"
            aria-label={txt.close}
          >
            X
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-56 border-r-4 border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-900/40 p-4 flex flex-col gap-5 select-none">
            {/* Scope / Collection selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black text-gray-950 dark:text-gray-300 uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-2">
                {isPt ? 'Coleções' : 'Collections'}
              </span>
              <button
                onClick={() => setActiveCollection('global')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                  activeCollection === 'global'
                    ? 'bg-yellow-400 text-black shadow-none translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{txt.globalScope}</span>
              </button>
              {showLocalScope && (
                <button
                  onClick={() => setActiveCollection('local')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                    activeCollection === 'local'
                      ? 'bg-yellow-400 text-black shadow-none translate-y-0.5'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{txt.localScope}</span>
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-800 pt-4">
              <span className="text-[11px] font-black text-gray-950 dark:text-gray-300 uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-2">
                {isPt ? 'Tipos' : 'Types'}
              </span>
              <button
                onClick={() => setFilterType('all')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                  filterType === 'all'
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow-none translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-900 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                <span>{txt.allTypes}</span>
              </button>
              <button
                onClick={() => setFilterType('number')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                  filterType === 'number'
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow-none translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {typeStyles.number.icon}
                <span>{txt.typeNumber}</span>
              </button>
              <button
                onClick={() => setFilterType('string')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                  filterType === 'string'
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow-none translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {typeStyles.string.icon}
                <span>{txt.typeString}</span>
              </button>
              <button
                onClick={() => setFilterType('boolean')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-none text-left font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-2 ${
                  filterType === 'boolean'
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow-none translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {typeStyles.boolean.icon}
                <span>{txt.typeBoolean}</span>
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b-4 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 gap-4">
              {/* Search bar */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={txt.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-none font-mono text-sm focus:outline-none focus:border-blue-600 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Create Variable Dropdown Button */}
              {activeCollection === 'global' && (
                <div className="relative shrink-0" ref={createMenuRef}>
                  <button
                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-none font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{txt.createBtn}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isCreateMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] py-1 z-50 flex flex-col">
                      <button
                        onClick={() => handleCreateVariable('number')}
                        className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-black text-xs uppercase text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        {typeStyles.number.icon}
                        <span>{txt.typeNumber}</span>
                      </button>
                      <button
                        onClick={() => handleCreateVariable('string')}
                        className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-black text-xs uppercase text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        {typeStyles.string.icon}
                        <span>{txt.typeString}</span>
                      </button>
                      <button
                        onClick={() => handleCreateVariable('boolean')}
                        className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-black text-xs uppercase text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        {typeStyles.boolean.icon}
                        <span>{txt.typeBoolean}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Variables List */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {displayedVars.length > 0 ? (
                <table className="w-full text-left border-collapse border-2 border-gray-900 dark:border-gray-200">
                  <thead>
                    <tr className="select-none">
                      {activeCollection === 'local' && (
                        <th className="py-2.5 px-3 border-b-2 border-r-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:text-gray-100 font-black uppercase text-[11px] tracking-wider bg-gray-100 dark:bg-gray-800 text-center w-16">
                          {txt.activeInScene}
                        </th>
                      )}
                      <th className="py-2.5 px-3 border-b-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:text-gray-100 font-black uppercase text-[11px] tracking-wider bg-gray-100 dark:bg-gray-800">
                        {txt.colName}
                      </th>
                      <th className="py-2.5 px-3 border-b-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:text-gray-100 font-black uppercase text-[11px] tracking-wider bg-gray-100 dark:bg-gray-800 w-32">
                        {txt.colType}
                      </th>
                      <th className="py-2.5 px-3 border-b-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:text-gray-100 font-black uppercase text-[11px] tracking-wider bg-gray-100 dark:bg-gray-800">
                        {activeCollection === 'global' ? txt.colValue : txt.colLocalValue}
                      </th>
                      {activeCollection === 'global' && (
                        <th className="py-2.5 px-3 border-b-2 border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-800 w-12 text-center" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedVars.map(({ key, value, type, isLocalActive, localValue }) => {
                      const displayVal = activeCollection === 'global' ? value : (isLocalActive ? localValue : value);
                      const displayValClean = stripQuotes(displayVal);
                      const style = typeStyles[type] || typeStyles.string;

                      return (
                        <tr key={key} className="border-b-2 border-gray-900 dark:border-gray-850 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group">
                          {/* Active state in Local override collection */}
                          {activeCollection === 'local' && (
                            <td className="py-3 px-3 text-center border-r-2 border-gray-900 dark:border-gray-850">
                              <input
                                type="checkbox"
                                checked={isLocalActive}
                                onChange={(e) => handleToggleLocalActive(key, e.target.checked)}
                                className="h-4 w-4 text-blue-650 border-2 border-gray-900 rounded-none focus:ring-0 accent-blue-600 cursor-pointer"
                              />
                            </td>
                          )}

                          {/* Variable Name field */}
                          <td className="py-3 px-3 border-r-2 border-gray-900 dark:border-gray-850">
                            <div className="flex items-center gap-1 font-mono text-sm">
                              <span className="text-gray-900 dark:text-gray-200 font-black select-none">$</span>
                              {activeCollection === 'global' ? (
                                <input
                                  type="text"
                                  defaultValue={key}
                                  onBlur={(e) => handleRenameVariable(key, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                  className="px-2 py-0.5 border-2 border-transparent hover:border-gray-900 dark:hover:border-gray-200 focus:border-blue-600 focus:bg-white dark:focus:bg-gray-900 bg-transparent rounded-none font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none w-full"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-gray-100 font-bold px-2">
                                  {key}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type Column */}
                          <td className="py-3 px-3 border-r-2 border-gray-900 dark:border-gray-850">
                            {activeCollection === 'global' ? (
                              <div className="relative">
                                <button
                                  onClick={() => setActiveTypeDropdown(activeTypeDropdown === key ? null : key)}
                                  className={`flex items-center px-2.5 py-1 border-2 border-gray-900 dark:border-gray-250 font-black text-[10px] uppercase cursor-pointer rounded-none transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none ${style.badge}`}
                                >
                                  {style.icon}
                                  <span>{style.label}</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {/* Dropdown menu for selecting type */}
                                {activeTypeDropdown === key && (
                                  <div ref={typeDropdownRef} className="absolute left-0 mt-2 w-32 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] py-1 z-50 flex flex-col">
                                    {Object.entries(typeStyles).map(([tKey, tVal]) => (
                                      <button
                                        key={tKey}
                                        onClick={() => handleChangeType(key, tKey)}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-black text-[10px] uppercase text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                                      >
                                        {tVal.icon}
                                        <span>{tVal.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 border-2 border-gray-900 dark:border-gray-250 font-black text-[10px] uppercase select-none rounded-none ${style.badge}`}>
                                {style.icon}
                                <span>{style.label}</span>
                              </span>
                            )}
                          </td>

                          {/* Value Input Column */}
                          <td className="py-3 px-3 border-r-2 border-gray-900 dark:border-gray-850 last:border-r-0">
                            <div className="w-full">
                              {/* Boolean: Toggle true/false */}
                              {type === 'boolean' && (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleUpdateValue(key, 'true')}
                                    disabled={activeCollection === 'local' && !isLocalActive}
                                    className={`px-3 py-1 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase rounded-none transition-all cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none disabled:opacity-40 ${
                                      displayValClean.toLowerCase() === 'true'
                                        ? 'bg-purple-600 text-white shadow-none translate-y-0.5'
                                        : 'bg-white dark:bg-gray-900 text-gray-500 hover:border-purple-600'
                                    }`}
                                  >
                                    true
                                  </button>
                                  <button
                                    onClick={() => handleUpdateValue(key, 'false')}
                                    disabled={activeCollection === 'local' && !isLocalActive}
                                    className={`px-3 py-1 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase rounded-none transition-all cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none disabled:opacity-40 ${
                                      displayValClean.toLowerCase() === 'false'
                                        ? 'bg-purple-600 text-white shadow-none translate-y-0.5'
                                        : 'bg-white dark:bg-gray-900 text-gray-500 hover:border-purple-600'
                                    }`}
                                  >
                                    false
                                  </button>
                                </div>
                              )}

                              {/* Number Input */}
                              {type === 'number' && (
                                <input
                                  type="number"
                                  disabled={activeCollection === 'local' && !isLocalActive}
                                  value={displayValClean}
                                  onChange={(e) => handleUpdateValue(key, e.target.value)}
                                  className="w-40 px-2.5 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-none font-mono text-sm focus:outline-none focus:border-blue-600 disabled:opacity-40"
                                />
                              )}

                              {/* String Input */}
                              {type === 'string' && (
                                <input
                                  type="text"
                                  disabled={activeCollection === 'local' && !isLocalActive}
                                  value={displayValClean}
                                  onChange={(e) => handleUpdateValue(key, e.target.value)}
                                  placeholder={isPt ? '(vazio)' : '(empty)'}
                                  className="w-full max-w-xs px-2.5 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-none font-mono text-sm focus:outline-none focus:border-blue-600 disabled:opacity-40"
                                />
                              )}
                            </div>
                          </td>

                          {/* Action Column (Delete) */}
                          {activeCollection === 'global' && (
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setPendingDelete(key)}
                                className="p-1.5 border-2 border-transparent hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none text-gray-500 hover:text-red-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100 shadow-none"
                                title={txt.delete}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center select-none border-4 border-dashed border-gray-950 dark:border-gray-300 bg-gray-50 dark:bg-gray-900 p-8">
                  <div className="p-4 bg-yellow-400 text-gray-900 border-2 border-gray-900 rounded-none shadow-[4px_4px_0px_#000] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 text-base">{txt.noVars}</h3>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 max-w-xs leading-relaxed">
                    {activeCollection === 'global' ? txt.noVarsGlobalDesc : txt.noVarsLocalDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Footer inside main panel */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t-2 border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-1.5 text-xs text-gray-650 dark:text-gray-300 font-bold uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{txt.renameHint}</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 bg-black text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white rounded-none shadow-[2px_2px_0px_#888] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                {txt.close}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        message={
          isPt 
            ? `Tens a certeza que queres apagar a variável "$${pendingDelete}"? Ela será removida de todos os nós do projeto. Esta ação não pode ser desfeita.`
            : `Are you sure you want to delete variable "$${pendingDelete}"? It will be removed from all project passages. This action cannot be undone.`
        }
      />
    </div>
  );
}
