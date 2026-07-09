import { useCallback, useEffect } from 'react';
import { parseTwee3, exportToTwee3 } from '../utils/tweeParser';
import { triggerFileDownload, formatSystemNodes } from '../utils/textParsing';

/**
 * Custom hook that manages project persistence: auto-saving, i18n sync,
 * export/import of Twee3 files, AI import, and base template loading.
 *
 * @param {Object} params
 * @param {Array} params.nodes - Current nodes array
 * @param {Array} params.edges - Current edges array
 * @param {Object} params.translations - Translations state object { languages, keys }
 * @param {Function} params.setTranslations - Setter for translations state
 * @param {React.MutableRefObject} params.nodesRef - Ref to current nodes array
 * @param {React.MutableRefObject} params.edgesRef - Ref to current edges array
 * @param {Function} params.setNodes - ReactFlow setNodes updater
 * @param {Function} params.setEdges - ReactFlow setEdges updater
 * @param {Function} params.setParserWarnings - Setter for parser warnings
 * @param {Function} params.setImportError - Setter for import error message
 * @param {string} params.importText - Current import text input
 * @param {Function} params.takeSnapshot - Undo/redo snapshot function
 * @param {Function} params.t - i18next translation function
 * @param {Object} params.i18n - i18next instance
 * @returns {{ exportToTwine: Function, handleImport: Function, handleAiImportSuccess: Function, handleLoadBaseTemplate: Function }}
 */
export function useProjectPersistence({
  nodes, edges, translations, setTranslations,
  nodesRef, edgesRef, setNodes, setEdges,
  setParserWarnings, setImportError, importText,
  takeSnapshot, t, i18n
}) {

  // --- Auto-Save Atómico ---
  // Guarda automaticamente o estado do projeto no LocalStorage sempre que
  // nós, arestas ou traduções mudam.
  useEffect(() => {
    localStorage.setItem('plot-in-a-pot-project', JSON.stringify({
      nodes,
      edges,
      translations,
      version: '1.0'
    }));
  }, [nodes, edges, translations]);

  // Sincroniza chaves de tradução no motor global do i18next.
  // Isso garante que as traduções do projeto estejam disponíveis em tempo real.
  useEffect(() => {
    const syncStoryTranslations = () => {
      translations.languages.forEach(lang => {
        if (i18n.hasResourceBundle(lang, 'translation')) {
          const formattedKeys = {};
          Object.keys(translations.keys || {}).forEach(key => {
            if (translations.keys[key] && translations.keys[key][lang] !== undefined) {
              formattedKeys[key] = translations.keys[key][lang];
            }
          });
          i18n.addResourceBundle(lang, 'translation', formattedKeys, true, true);
        }
      });
    };

    // Executa sincronização inicialmente
    syncStoryTranslations();

    // Regista listeners para sincronizar quando os ficheiros de idioma terminam de carregar via HTTP
    const handleEvents = () => {
      syncStoryTranslations();
    };

    i18n.on('loaded', handleEvents);
    i18n.on('languageChanged', handleEvents);

    return () => {
      i18n.off('loaded', handleEvents);
      i18n.off('languageChanged', handleEvents);
    };
  }, [translations, i18n]);

  const exportToTwine = useCallback((targetFormat = 'keys') => {
    const availableLanguages = translations?.languages || [];
    const normalizedInput = targetFormat.trim().toLowerCase();

    if (normalizedInput === 'keys' || availableLanguages.length === 0) {
      const result = exportToTwee3(nodesRef.current, edgesRef.current);
      triggerFileDownload(result, 'story_development_keys.twee');
      return;
    }

    const compiledNodes = nodesRef.current.map(node => {
      let nodeContent = node.data?.content || '';
      if (!nodeContent) return node;

      // Resolve t('key') / t("key") inline
      nodeContent = nodeContent.replace(/t\(['"]([^'"]+)['"]\)/g, (_, key) =>
        translations.keys[key]?.[normalizedInput] ||
        translations.keys[key]?.[availableLanguages[0]] ||
        key
      );

      // Resolve [[t("key")|Destino]]
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\|/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${text}|`;
      });
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\]\]/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${text}]]`;
      });

      // Resolve <<link "t('key')">>
      nodeContent = nodeContent.replace(/<<link\s+['"]t\(['"]([^'"]+)['"]\)['"]\s*>>/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `<<link "${text}">>`;
      });

      return { ...node, data: { ...node.data, content: nodeContent } };
    });

    triggerFileDownload(exportToTwee3(compiledNodes, edgesRef.current), `story_compiled_${normalizedInput}.twee`);
  }, [translations]);

  // --- Importação e Exportação de Ficheiros do Projeto ---
  // Importa texto Twee3 e converte em nós/arestas para o editor.
  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(importText);
      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      setParserWarnings(warnings || []);
      setImportError('');
    } catch (e) {
      console.error('Erro fatal na importação:', e);
      setImportError('Failed to parse story.');
    }
  }, [importText, setNodes, setEdges]);

  // Trata a importação de história gerada pela AI.
  const handleAiImportSuccess = useCallback((tweeText) => {
    try {
      takeSnapshot();
      const { nodes: newNodes, edges: newEdges } = parseTwee3(tweeText);
      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      alert(t('alerts.aiSuccess', 'AI generated your story successfully!'));
    } catch (e) {
      alert(t('alerts.aiInvalid', 'AI returned invalid output. Please try again.'));
      console.error(e);
    }
  }, [setNodes, setEdges, t, takeSnapshot]);

  // Carrega o template base e as traduções iniciais do servidor.
  const handleLoadBaseTemplate = useCallback(async () => {
    try {
      const [tweeResponse, csvResponse] = await Promise.all([
        fetch('/templates/base_template.twee'),
        fetch('/translations/base_template.csv')
      ]);

      if (!tweeResponse.ok) throw new Error(`Failed to fetch base_template.twee (status: ${tweeResponse.status})`);
      if (!csvResponse.ok) throw new Error(`Failed to fetch base_template.csv (status: ${csvResponse.status})`);

      const [tweeText, csvText] = await Promise.all([tweeResponse.text(), csvResponse.text()]);

      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(tweeText);

      const [headerLine, ...lines] = csvText.split('\n');
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

      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      setTranslations({ languages, keys: newKeys });
      setParserWarnings(warnings || []);
      setImportError('');
    } catch (err) {
      console.error('Error loading base template files:', err);
      alert(t('alerts.loadTemplateError', `Failed to load base template files: ${err.message}`));
    }
  }, [setNodes, setEdges, t]);

  return { exportToTwine, handleImport, handleAiImportSuccess, handleLoadBaseTemplate };
}
